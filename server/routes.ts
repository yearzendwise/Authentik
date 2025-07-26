import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
  enable2FASchema,
  disable2FASchema,
  verifyEmailSchema,
  resendVerificationSchema,
  createUserSchema,
  updateUserSchema,
  userFiltersSchema,
  billingInfoSchema,
  type UserRole,
} from "@shared/schema";
import Stripe from "stripe";
import { randomBytes } from "crypto";
import { authenticator } from "otplib";
import * as QRCode from "qrcode";
import { UAParser } from "ua-parser-js";
import { createHash } from "crypto";
import { emailService } from "./emailService";
import {
  sanitizeUserInput,
  sanitizeEmail,
  sanitizePassword,
  sanitizeName,
  sanitizeString,
  checkRateLimit,
  clearRateLimit,
  getClientIP,
} from "./utils/sanitization";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "your-super-secret-refresh-key";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Utility function to extract device information from request
function getDeviceInfo(req: any): {
  deviceId: string;
  deviceName: string;
  userAgent?: string;
  ipAddress?: string;
} {
  const userAgentString = req.get("User-Agent") || "Unknown";
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  // Create a unique device identifier based on user agent and IP
  const deviceFingerprint = `${result.browser.name}-${result.os.name}-${req.ip}`;
  const deviceId = createHash("sha256")
    .update(deviceFingerprint)
    .digest("hex")
    .substring(0, 16);

  // Generate user-friendly device name
  const browserName = result.browser.name || "Unknown Browser";
  const osName = result.os.name || "Unknown OS";
  const deviceName = `${browserName} on ${osName}`;

  return {
    deviceId,
    deviceName,
    userAgent: userAgentString,
    ipAddress: req.ip || req.connection?.remoteAddress || "Unknown",
  };
}
const ACCESS_TOKEN_EXPIRES = "2m"; // Shorter expiry for more immediate logout
const REFRESH_TOKEN_EXPIRES = "7d";

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId, decoded.tenantId);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Access token expired" });
    }
    return res.status(403).json({ message: "Invalid access token" });
  }
};

// Middleware to check user permissions
const requireRole = (allowedRoles: UserRole[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
};

// Middleware for admin-only operations
const requireAdmin = requireRole(["Administrator"]);

// Middleware for manager+ operations
const requireManagerOrAdmin = requireRole(["Manager", "Administrator"]);

const generateTokens = (userId: string, tenantId: string) => {
  const accessToken = jwt.sign({ userId, tenantId }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
  });
  const refreshToken = jwt.sign(
    { userId, tenantId, tokenId: randomBytes(16).toString("hex") },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES },
  );
  return { accessToken, refreshToken };
};

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(cookieParser());

  // Clean up expired tokens periodically
  setInterval(
    async () => {
      try {
        await storage.cleanExpiredTokens();
      } catch (error) {
        console.error("Failed to clean expired tokens:", error);
      }
    },
    24 * 60 * 60 * 1000,
  ); // Once per day

  // Register endpoint with input sanitization
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Get client IP for rate limiting
      const clientIP = getClientIP(req);

      // Basic rate limiting for registration
      if (!checkRateLimit(clientIP, 3, 10 * 60 * 1000)) {
        // 3 attempts per 10 minutes
        return res.status(429).json({
          message: "Too many registration attempts. Please try again later.",
        });
      }

      const rawData = registerSchema.parse(req.body);

      // Sanitize all input data
      const sanitizedData = sanitizeUserInput({
        email: rawData.email,
        password: rawData.password,
        firstName: rawData.firstName,
        lastName: rawData.lastName,
      });

      if (
        !sanitizedData.email ||
        !sanitizedData.password ||
        !sanitizedData.firstName ||
        !sanitizedData.lastName
      ) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Use the default tenant
      const tenant = await storage.getTenantBySlug("default");
      if (!tenant) {
        return res.status(500).json({ message: "System configuration error" });
      }

      // Check if user already exists in the default tenant
      const existingUser = await storage.getUserByEmail(
        sanitizedData.email,
        tenant.id,
      );
      if (existingUser) {
        return res
          .status(409)
          .json({ message: "User already exists with this email" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(sanitizedData.password, 12);

      // Create user with sanitized data
      const user = await storage.createUser({
        tenantId: tenant.id,
        email: sanitizedData.email,
        password: hashedPassword,
        firstName: sanitizedData.firstName,
        lastName: sanitizedData.lastName,
      });

      // Clear rate limit on successful registration
      clearRateLimit(clientIP);

      // Generate email verification token
      const verificationToken = randomBytes(32).toString("hex");
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Set verification token in database
      await storage.setEmailVerificationToken(
        user.id,
        tenant.id,
        verificationToken,
        verificationExpires,
      );

      // Send verification email
      try {
        await emailService.sendVerificationEmail(
          user.email,
          verificationToken,
          user.firstName || undefined,
        );
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Continue with registration, console URL is already logged
      }

      res.status(201).json({
        message:
          "User created successfully. Please check the server console for the verification URL since email delivery is restricted.",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: false,
        },
        developmentNote: "Check server console for verification URL",
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Login endpoint with input sanitization and rate limiting
  app.post("/api/auth/login", async (req, res) => {
    try {
      // Get client IP for rate limiting
      const clientIP = getClientIP(req);

      // Check rate limit
      if (!checkRateLimit(clientIP)) {
        return res.status(429).json({
          message: "Too many login attempts. Please try again later.",
        });
      }

      // Parse and sanitize input data
      const rawData = loginSchema.parse(req.body);
      const sanitizedEmail = sanitizeEmail(rawData.email);
      const sanitizedPassword = sanitizePassword(rawData.password);
      const sanitizedTwoFactorToken = sanitizeString(rawData.twoFactorToken);

      if (!sanitizedEmail || !sanitizedPassword) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      // Always use default tenant for backward compatibility
      const tenant = await storage.getTenantBySlug("default");
      if (!tenant) {
        return res.status(500).json({ message: "System configuration error" });
      }

      // Find user by email within tenant
      const user = await storage.getUserByEmail(sanitizedEmail, tenant.id);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(
        sanitizedPassword,
        user.password,
      );
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Allow login but mark verification status
      const emailVerificationRequired = !user.emailVerified;

      // Check 2FA if enabled
      if (user.twoFactorEnabled) {
        if (!sanitizedTwoFactorToken) {
          return res.status(200).json({
            message: "2FA token required",
            requires2FA: true,
            tempLoginId: user.id, // In production, use a temporary encrypted token
          });
        }

        if (!user.twoFactorSecret) {
          return res.status(500).json({ message: "2FA configuration error" });
        }

        const isValid2FA = authenticator.verify({
          token: sanitizedTwoFactorToken,
          secret: user.twoFactorSecret,
        });

        if (!isValid2FA) {
          return res.status(401).json({ message: "Invalid 2FA token" });
        }
      }

      // Clear rate limit on successful login
      clearRateLimit(clientIP);

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(
        user.id,
        user.tenantId,
      );

      // Get device information
      const deviceInfo = getDeviceInfo(req);

      // Store refresh token in database with device info
      const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await storage.createRefreshToken(
        user.id,
        user.tenantId,
        refreshToken,
        refreshTokenExpiry,
        deviceInfo,
      );

      // Set refresh token as httpOnly cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax", // Changed from "strict" to "lax" for better cross-site behavior
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        message: "Login successful",
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled,
          emailVerified: user.emailVerified,
        },
        emailVerificationRequired,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Email verification endpoint
  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = verifyEmailSchema.parse(req.query);

      // Find user by verification token
      const user = await storage.getUserByEmailVerificationToken(token);
      if (!user) {
        return res.status(400).json({
          message:
            "Invalid or expired verification token. Please request a new verification email.",
        });
      }

      // Verify the user's email
      await storage.verifyUserEmail(user.id, user.tenantId);

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(
          user.email,
          user.firstName || undefined,
        );
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Continue even if welcome email fails
      }

      res.json({
        message:
          "Email verified successfully! You can now log in to your account.",
        verified: true,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Invalid verification token format",
          errors: error.errors,
        });
      }
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Resend verification email endpoint
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = resendVerificationSchema.parse(req.body);

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // For backward compatibility, use default tenant
      const tenant = await storage.getTenantBySlug("default");
      if (!tenant) {
        return res.status(500).json({ message: "System configuration error" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email, tenant.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Check rate limiting - 5 minutes between resend requests
      if (user.lastVerificationEmailSent) {
        const timeSinceLastSent =
          Date.now() - user.lastVerificationEmailSent.getTime();
        const fiveMinutesInMs = 5 * 60 * 1000;

        if (timeSinceLastSent < fiveMinutesInMs) {
          const remainingTime = Math.ceil(
            (fiveMinutesInMs - timeSinceLastSent) / 1000 / 60,
          );
          return res.status(429).json({
            message: `Please wait ${remainingTime} minute(s) before requesting another verification email.`,
            retryAfter: remainingTime,
          });
        }
      }

      // Generate new verification token
      const verificationToken = randomBytes(32).toString("hex");
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update verification token in database
      await storage.setEmailVerificationToken(
        user.id,
        user.tenantId,
        verificationToken,
        verificationExpires,
      );

      // Send verification email
      try {
        await emailService.sendVerificationEmail(
          user.email,
          verificationToken,
          user.firstName || undefined,
        );
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        return res
          .status(500)
          .json({ message: "Failed to send verification email" });
      }

      res.json({
        message:
          "Verification email sent successfully. Please check your inbox.",
        nextAllowedAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Development endpoint to verify email without actual email
  app.post("/api/auth/dev-verify-email", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // For backward compatibility, use default tenant
      const tenant = await storage.getTenantBySlug("default");
      if (!tenant) {
        return res.status(500).json({ message: "System configuration error" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email, tenant.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Verify the user's email directly
      await storage.verifyUserEmail(user.id, user.tenantId);

      res.json({
        message: "Email verified successfully! (Development mode)",
        verified: true,
      });
    } catch (error: any) {
      console.error("Dev email verification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Refresh token endpoint
  app.post("/api/auth/refresh", async (req, res) => {
    try {
      console.log("🔄 [Server] Refresh token request received");
      console.log("🔄 [Server] Cookies:", req.cookies);
      console.log("🔄 [Server] Headers:", req.headers);

      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        console.log("🔄 [Server] No refresh token found in cookies");
        return res.status(401).json({ message: "Refresh token required" });
      }

      console.log("🔄 [Server] Refresh token found, verifying...");

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as any;
      console.log("🔄 [Server] Token decoded successfully:", {
        userId: decoded.userId,
        tenantId: decoded.tenantId,
      });

      // Check if refresh token exists in database and is not expired
      const storedToken = await storage.getRefreshToken(refreshToken);
      if (!storedToken) {
        console.log("🔄 [Server] Refresh token not found in database");
        return res.status(401).json({ message: "Invalid refresh token" });
      }
      console.log("🔄 [Server] Refresh token found in database");

      // Get user with tenant context
      const user = await storage.getUser(decoded.userId, decoded.tenantId);
      if (!user || !user.isActive) {
        console.log("🔄 [Server] User not found or inactive");
        return res.status(401).json({ message: "User not found or inactive" });
      }
      console.log("🔄 [Server] User found and active");

      // Update session last used time
      await storage.updateSessionLastUsed(refreshToken);

      // Generate new tokens with tenant context
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(
        user.id,
        user.tenantId,
      );
      console.log("🔄 [Server] New tokens generated");

      // Get device info to preserve it in the new token
      const deviceInfo = getDeviceInfo(req);

      // Remove old refresh token and store new one with preserved device info
      await storage.deleteRefreshToken(refreshToken);
      const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await storage.createRefreshToken(
        user.id,
        user.tenantId,
        newRefreshToken,
        refreshTokenExpiry,
        {
          deviceId: storedToken.deviceId || deviceInfo.deviceId,
          deviceName: storedToken.deviceName || deviceInfo.deviceName,
          userAgent: deviceInfo.userAgent,
          ipAddress: deviceInfo.ipAddress,
        },
      );

      // Set new refresh token as httpOnly cookie
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax", // Changed from "strict" to "lax"
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      console.log("🔄 [Server] Sending successful refresh response");
      res.json({
        message: "Token refreshed successfully",
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled,
          emailVerified: user.emailVerified,
          menuExpanded: user.menuExpanded || false,
        },
      });
    } catch (error: any) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ message: "Refresh token expired" });
      }
      console.error("Token refresh error:", error);
      res.status(401).json({ message: "Invalid refresh token" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", authenticateToken, async (req: any, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        await storage.deleteRefreshToken(refreshToken);
      }

      // Clear refresh token cookie
      res.clearCookie("refreshToken");

      res.json({ message: "Logout successful" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Check authentication status endpoint - doesn't require access token
  app.get("/api/auth/check", async (req, res) => {
    try {
      console.log("🔍 [Server] Auth check request received");
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        console.log("🔍 [Server] No refresh token in cookies");
        return res.json({ hasAuth: false });
      }

      // Try to verify the refresh token
      try {
        const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as any;

        // Check if refresh token exists in database
        const storedToken = await storage.getRefreshToken(refreshToken);
        if (!storedToken) {
          console.log("🔍 [Server] Refresh token not found in database");
          return res.json({ hasAuth: false });
        }

        console.log("🔍 [Server] Valid refresh token found");
        return res.json({ hasAuth: true });
      } catch (error) {
        console.log("🔍 [Server] Invalid refresh token:", error);
        return res.json({ hasAuth: false });
      }
    } catch (error) {
      console.error("Auth check error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current user endpoint
  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        twoFactorEnabled: req.user.twoFactorEnabled,
        emailVerified: req.user.emailVerified,
        menuExpanded: req.user.menuExpanded || false,
      },
    });
  });

  // Update menu preference endpoint
  app.patch(
    "/api/auth/menu-preference",
    authenticateToken,
    async (req: any, res) => {
      try {
        const { menuExpanded } = req.body;

        if (typeof menuExpanded !== "boolean") {
          return res
            .status(400)
            .json({ message: "Menu preference must be a boolean value" });
        }

        await storage.updateUser(
          req.user.id,
          { menuExpanded },
          req.user.tenantId,
        );

        res.json({
          message: "Menu preference updated successfully",
          menuExpanded,
        });
      } catch (error) {
        console.error("Update menu preference error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Logout from all devices
  app.post("/api/auth/logout-all", authenticateToken, async (req: any, res) => {
    try {
      await storage.deleteUserRefreshTokens(req.user.id, req.user.tenantId);
      res.clearCookie("refreshToken");
      res.json({ message: "Logged out from all devices" });
    } catch (error) {
      console.error("Logout all error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update profile endpoint
  app.put("/api/auth/profile", authenticateToken, async (req: any, res) => {
    try {
      const rawData = updateProfileSchema.parse(req.body);

      // Sanitize input data
      const sanitizedData = sanitizeUserInput({
        firstName: rawData.firstName,
        lastName: rawData.lastName,
        email: rawData.email,
      });

      // Check if email is already taken by another user
      if (sanitizedData.email && sanitizedData.email !== req.user.email) {
        const existingUser = await storage.getUserByEmail(
          sanitizedData.email,
          req.user.tenantId,
        );
        if (existingUser && existingUser.id !== req.user.id) {
          return res
            .status(409)
            .json({ message: "Email already taken by another user" });
        }
      }

      const updatedUser = await storage.updateUser(
        req.user.id,
        sanitizedData,
        req.user.tenantId,
      );

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "Profile updated successfully",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
        },
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Change password endpoint with input sanitization
  app.put(
    "/api/auth/change-password",
    authenticateToken,
    async (req: any, res) => {
      try {
        const rawData = changePasswordSchema.parse(req.body);
        const currentPassword = sanitizePassword(rawData.currentPassword);
        const newPassword = sanitizePassword(rawData.newPassword);

        if (!currentPassword || !newPassword) {
          return res
            .status(400)
            .json({
              message: "Current password and new password are required",
            });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(
          currentPassword,
          req.user.password,
        );
        if (!isValidPassword) {
          return res
            .status(400)
            .json({ message: "Current password is incorrect" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        const updatedUser = await storage.updateUser(
          req.user.id,
          { password: hashedPassword },
          req.user.tenantId,
        );

        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }

        // Revoke all refresh tokens to force re-authentication on all devices
        await storage.deleteUserRefreshTokens(req.user.id, req.user.tenantId);

        res.json({
          message: "Password changed successfully. Please log in again.",
        });
      } catch (error: any) {
        if (error.name === "ZodError") {
          return res.status(400).json({
            message: "Validation error",
            errors: error.errors,
          });
        }
        console.error("Password change error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Generate 2FA setup
  app.post("/api/auth/2fa/setup", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.twoFactorEnabled) {
        return res.status(400).json({ message: "2FA is already enabled" });
      }

      // Generate secret
      const secret = authenticator.generateSecret();
      const serviceName = "SecureAuth";
      const accountName = req.user.email;

      // Generate QR code URL
      const otpauthUrl = authenticator.keyuri(accountName, serviceName, secret);
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

      // Store the secret temporarily (not enabled until verified)
      await storage.updateUser(
        req.user.id,
        { twoFactorSecret: secret },
        req.user.tenantId,
      );

      res.json({
        secret,
        qrCode: qrCodeDataUrl,
        backupCodes: [], // In production, generate backup codes
      });
    } catch (error) {
      console.error("2FA setup error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Enable 2FA
  app.post("/api/auth/2fa/enable", authenticateToken, async (req: any, res) => {
    try {
      const { token } = enable2FASchema.parse(req.body);

      if (req.user.twoFactorEnabled) {
        return res.status(400).json({ message: "2FA is already enabled" });
      }

      if (!req.user.twoFactorSecret) {
        return res.status(400).json({ message: "2FA setup not initiated" });
      }

      // Verify the token
      const isValid = authenticator.verify({
        token,
        secret: req.user.twoFactorSecret,
      });

      if (!isValid) {
        return res.status(400).json({ message: "Invalid 2FA token" });
      }

      // Enable 2FA
      await storage.updateUser(
        req.user.id,
        { twoFactorEnabled: true },
        req.user.tenantId,
      );

      res.json({ message: "2FA enabled successfully" });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      console.error("2FA enable error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Disable 2FA
  app.post(
    "/api/auth/2fa/disable",
    authenticateToken,
    async (req: any, res) => {
      try {
        const { token } = disable2FASchema.parse(req.body);

        if (!req.user.twoFactorEnabled) {
          return res.status(400).json({ message: "2FA is not enabled" });
        }

        if (!req.user.twoFactorSecret) {
          return res.status(400).json({ message: "2FA configuration error" });
        }

        // Verify the token
        const isValid = authenticator.verify({
          token,
          secret: req.user.twoFactorSecret,
        });

        if (!isValid) {
          return res.status(400).json({ message: "Invalid 2FA token" });
        }

        // Disable 2FA and remove secret
        await storage.updateUser(
          req.user.id,
          {
            twoFactorEnabled: false,
            twoFactorSecret: null,
          },
          req.user.tenantId,
        );

        res.json({ message: "2FA disabled successfully" });
      } catch (error: any) {
        if (error.name === "ZodError") {
          return res.status(400).json({
            message: "Validation error",
            errors: error.errors,
          });
        }
        console.error("2FA disable error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Delete account endpoint
  app.delete("/api/auth/account", authenticateToken, async (req: any, res) => {
    try {
      // Deactivate user instead of deleting
      const updatedUser = await storage.updateUser(
        req.user.id,
        { isActive: false },
        req.user.tenantId,
      );

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Revoke all refresh tokens
      await storage.deleteUserRefreshTokens(req.user.id, req.user.tenantId);

      // Clear refresh token cookie
      res.clearCookie("refreshToken");

      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Account deletion error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Forgot password endpoint (placeholder)
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);

      // For backward compatibility, use default tenant
      const tenant = await storage.getTenantBySlug("default");
      if (!tenant) {
        return res.status(500).json({ message: "System configuration error" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email, tenant.id);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({
          message: "If the email exists, a reset link has been sent",
        });
      }

      // TODO: Implement email sending logic
      // For now, just return success message
      res.json({ message: "If the email exists, a reset link has been sent" });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Device session management endpoints

  // Get user's active sessions
  app.get("/api/auth/sessions", authenticateToken, async (req: any, res) => {
    try {
      const sessions = await storage.getUserSessions(
        req.user.id,
        req.user.tenantId,
      );

      // Get current session token to mark it as current
      const currentRefreshToken = req.cookies.refreshToken;

      const sessionData = sessions.map((session) => ({
        id: session.id,
        deviceId: session.deviceId,
        deviceName: session.deviceName || "Unknown Device",
        ipAddress: session.ipAddress,
        location: session.location,
        lastUsed: session.lastUsed,
        isCurrent: session.token === currentRefreshToken,
        createdAt: session.createdAt,
      }));

      res.json({ sessions: sessionData });
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete a specific session (logout from specific device)
  app.delete(
    "/api/auth/sessions/:sessionId",
    authenticateToken,
    async (req: any, res) => {
      try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        await storage.deleteSession(sessionId, userId, req.user.tenantId);

        res.json({ message: "Session deleted successfully" });
      } catch (error) {
        console.error("Delete session error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Delete all other sessions (logout from all other devices)
  app.delete("/api/auth/sessions", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentRefreshToken = req.cookies.refreshToken;

      if (!currentRefreshToken) {
        // If no refresh token cookie, check if user has any sessions and delete all
        console.log(
          "No refresh token cookie found, deleting all user sessions",
        );
        await storage.deleteAllUserSessions(userId, req.user.tenantId);
        return res.json({ message: "All sessions logged out successfully" });
      }

      // Verify the refresh token exists in database
      const refreshTokenData =
        await storage.getRefreshToken(currentRefreshToken);
      if (!refreshTokenData) {
        console.log(
          "Refresh token not found in database, deleting all user sessions",
        );
        await storage.deleteAllUserSessions(userId, req.user.tenantId);
        return res.json({ message: "All sessions logged out successfully" });
      }

      // Delete all sessions except the current one using database query directly
      console.log("Deleting other sessions for user:", userId);
      await storage.deleteOtherUserSessions(
        userId,
        currentRefreshToken,
        req.user.tenantId,
      );

      res.json({ message: "All other sessions logged out successfully" });
    } catch (error) {
      console.error("Delete all sessions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User Management API Routes

  // Get all users (Admin/Manager only)
  app.get(
    "/api/users",
    authenticateToken,
    requireManagerOrAdmin,
    async (req: any, res) => {
      try {
        const filters = userFiltersSchema.parse(req.query);
        const users = await storage.getAllUsers(req.user.tenantId, filters);

        // Remove sensitive data before sending
        const safeUsers = users.map((user) => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }));

        res.json({ users: safeUsers });
      } catch (error: any) {
        if (error.name === "ZodError") {
          return res.status(400).json({
            message: "Validation error",
            errors: error.errors,
          });
        }
        console.error("Get users error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Get user statistics (Admin/Manager only)
  app.get(
    "/api/users/stats",
    authenticateToken,
    requireManagerOrAdmin,
    async (req: any, res) => {
      try {
        const stats = await storage.getUserStats(req.user.tenantId);
        res.json(stats);
      } catch (error) {
        console.error("Get user stats error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Create a new user (Admin only)
  app.post(
    "/api/users",
    authenticateToken,
    requireAdmin,
    async (req: any, res) => {
      try {
        const userData = createUserSchema.parse(req.body);

        // Check if user already exists in tenant
        const existingUser = await storage.getUserByEmail(
          userData.email,
          req.user.tenantId,
        );
        if (existingUser) {
          return res
            .status(400)
            .json({ message: "User with this email already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 12);

        // Create user
        const user = await storage.createUserAsAdmin(
          {
            ...userData,
            password: hashedPassword,
          },
          req.user.tenantId,
        );

        // Remove sensitive data before sending
        const safeUser = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        };

        res.status(201).json({
          message: "User created successfully",
          user: safeUser,
        });
      } catch (error: any) {
        if (error.name === "ZodError") {
          return res.status(400).json({
            message: "Validation error",
            errors: error.errors,
          });
        }
        console.error("Create user error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Update a user (Admin only)
  app.put(
    "/api/users/:id",
    authenticateToken,
    requireAdmin,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const userData = updateUserSchema.parse(req.body);

        // Check if user exists in tenant
        const existingUser = await storage.getUser(id, req.user.tenantId);
        if (!existingUser) {
          return res.status(404).json({ message: "User not found" });
        }

        // Check if email is being changed and if it's already taken
        if (userData.email !== existingUser.email) {
          const emailTaken = await storage.getUserByEmail(
            userData.email,
            req.user.tenantId,
          );
          if (emailTaken) {
            return res
              .status(400)
              .json({ message: "Email already in use by another user" });
          }
        }

        const updatedUser = await storage.updateUserAsAdmin(
          id,
          userData,
          req.user.tenantId,
        );

        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }

        // If user is deactivated, delete all their sessions
        if (!userData.isActive) {
          await storage.deleteUserRefreshTokens(id, req.user.tenantId);
        }

        // Remove sensitive data before sending
        const safeUser = {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
          emailVerified: updatedUser.emailVerified,
          updatedAt: updatedUser.updatedAt,
        };

        res.json({
          message: "User updated successfully",
          user: safeUser,
        });
      } catch (error: any) {
        if (error.name === "ZodError") {
          return res.status(400).json({
            message: "Validation error",
            errors: error.errors,
          });
        }
        console.error("Update user error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Delete a user (Admin only)
  app.delete(
    "/api/users/:id",
    authenticateToken,
    requireAdmin,
    async (req: any, res) => {
      try {
        const { id } = req.params;

        // Prevent admin from deleting themselves
        if (id === req.user.id) {
          return res
            .status(400)
            .json({ message: "Cannot delete your own account" });
        }

        // Check if user exists in tenant
        const existingUser = await storage.getUser(id, req.user.tenantId);
        if (!existingUser) {
          return res.status(404).json({ message: "User not found" });
        }

        await storage.deleteUser(id, req.user.tenantId);

        res.json({ message: "User deleted successfully" });
      } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Toggle user status (Admin only)
  app.patch(
    "/api/users/:id/status",
    authenticateToken,
    requireAdmin,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (typeof isActive !== "boolean") {
          return res
            .status(400)
            .json({ message: "isActive must be a boolean" });
        }

        // Prevent admin from deactivating themselves
        if (id === req.user.id && !isActive) {
          return res
            .status(400)
            .json({ message: "Cannot deactivate your own account" });
        }

        const updatedUser = await storage.toggleUserStatus(
          id,
          isActive,
          req.user.tenantId,
        );

        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }

        // If user is deactivated, delete all their sessions
        if (!isActive) {
          await storage.deleteUserRefreshTokens(id, req.user.tenantId);
        }

        res.json({
          message: `User ${isActive ? "activated" : "deactivated"} successfully`,
          user: {
            id: updatedUser.id,
            isActive: updatedUser.isActive,
          },
        });
      } catch (error) {
        console.error("Toggle user status error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Subscription plans API
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error: any) {
      res
        .status(500)
        .json({
          message: "Error fetching subscription plans: " + error.message,
        });
    }
  });

  // Create subscription for free trial signup (no auth required)
  app.post("/api/free-trial-signup", async (req: any, res) => {
    try {
      const { email, firstName, lastName, password, planId, billingCycle } =
        req.body;

      // Validate required fields
      if (!email || !firstName || !lastName || !password || !planId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get default tenant
      const tenant = await storage.getTenantBySlug("default");
      if (!tenant) {
        return res.status(500).json({ message: "System configuration error" });
      }

      // Check if user already exists
      try {
        const existingUser = await storage.getUserByEmail(email, tenant.id);
        if (existingUser) {
          return res.status(400).json({ message: "User already exists" });
        }
      } catch (error) {
        // User doesn't exist, continue with creation
      }

      // Get the subscription plan
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }

      // Create user account
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await storage.createUser({
        tenantId: tenant.id,
        email,
        firstName,
        lastName,
        password: hashedPassword,
        emailVerified: false,
        role: "User",
      });

      // Generate email verification token
      const verificationToken = require("crypto")
        .randomBytes(32)
        .toString("hex");
      await storage.setEmailVerificationToken(
        newUser.id,
        tenant.id,
        verificationToken,
        new Date(Date.now() + 24 * 60 * 60 * 1000),
      );

      // Send verification email
      try {
        await emailService.sendVerificationEmail(
          email,
          `${firstName} ${lastName}`,
          verificationToken,
        );
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: newUser.email,
        name: `${newUser.firstName} ${newUser.lastName}`,
      });

      // Get the correct price ID based on billing cycle
      const priceId =
        billingCycle === "yearly"
          ? plan.stripeYearlyPriceId || plan.stripePriceId
          : plan.stripePriceId;

      // Create Stripe subscription with free trial
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        trial_period_days: plan.trialDays || 14,
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
      });

      // Helper function to safely convert Stripe timestamps to dates
      const safeTimestampToDate = (timestamp: any): Date | null => {
        if (!timestamp) return null;
        if (typeof timestamp === "number") {
          const date = new Date(timestamp * 1000);
          return isNaN(date.getTime()) ? null : date;
        }
        return null;
      };

      // Save subscription to database
      await storage.createSubscription({
        tenantId: tenant.id,
        userId: newUser.id,
        planId: plan.id,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
        status: subscription.status,
        currentPeriodStart:
          safeTimestampToDate((subscription as any).current_period_start) ||
          new Date(),
        currentPeriodEnd:
          safeTimestampToDate((subscription as any).current_period_end) ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        trialStart: safeTimestampToDate((subscription as any).trial_start),
        trialEnd: safeTimestampToDate((subscription as any).trial_end),
        isYearly: billingCycle === "yearly",
      });

      // Update user with Stripe info
      // Note: updateUserStripeInfo method would need to be implemented in storage

      res.status(201).json({
        message:
          "Account created successfully! Please check your email to verify your account.",
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        },
        subscription: {
          id: subscription.id,
          status: subscription.status,
          trialEnd: safeTimestampToDate((subscription as any).trial_end),
        },
      });
    } catch (error: any) {
      console.error("Free trial signup error:", error);
      res
        .status(500)
        .json({ message: "Error creating account: " + error.message });
    }
  });

  // Create subscription and payment intent (for existing users)
  app.post(
    "/api/create-subscription",
    authenticateToken,
    async (req: any, res) => {
      try {
        const billingData = billingInfoSchema.parse(req.body);
        const user = req.user;

        // Get the selected plan
        const plan = await storage.getSubscriptionPlan(billingData.planId);
        if (!plan) {
          return res
            .status(404)
            .json({ message: "Subscription plan not found" });
        }

        // Create or get Stripe customer
        let customer;
        if (user.stripeCustomerId) {
          customer = await stripe.customers.retrieve(user.stripeCustomerId);
        } else {
          customer = await stripe.customers.create({
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
          });
        }

        // Determine the price ID based on billing cycle
        const priceId =
          billingData.billingCycle === "yearly"
            ? plan.stripeYearlyPriceId || plan.stripePriceId
            : plan.stripePriceId;

        // Create Stripe subscription
        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: priceId }],
          payment_behavior: "default_incomplete",
          payment_settings: { save_default_payment_method: "on_subscription" },
          expand: ["latest_invoice.payment_intent"],
          trial_period_days: plan.trialDays || undefined,
        });

        // Helper function to safely convert Stripe timestamps to dates
        const safeTimestampToDate = (timestamp: any): Date | null => {
          if (!timestamp) return null;
          if (typeof timestamp === "number") {
            const date = new Date(timestamp * 1000);
            return isNaN(date.getTime()) ? null : date;
          }
          return null;
        };

        // Save subscription to database
        await storage.createSubscription({
          tenantId: user.tenantId,
          userId: user.id,
          planId: plan.id,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customer.id,
          status: subscription.status,
          currentPeriodStart:
            safeTimestampToDate((subscription as any).current_period_start) ||
            new Date(),
          currentPeriodEnd:
            safeTimestampToDate((subscription as any).current_period_end) ||
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days from now
          trialStart: safeTimestampToDate((subscription as any).trial_start),
          trialEnd: safeTimestampToDate((subscription as any).trial_end),
          isYearly: billingData.billingCycle === "yearly",
        });

        // Update user with Stripe info
        await storage.updateUserStripeInfo(
          user.id,
          customer.id,
          subscription.id,
        );

        const invoice = subscription.latest_invoice as any;
        const paymentIntent = invoice?.payment_intent as any;

        // For trial subscriptions, there might not be a payment intent initially
        res.json({
          subscriptionId: subscription.id,
          clientSecret: paymentIntent?.client_secret || null,
          status: subscription.status,
          requiresPayment: !!paymentIntent?.client_secret,
          trialEnd: safeTimestampToDate((subscription as any).trial_end),
        });
      } catch (error: any) {
        console.error("Error creating subscription:", error);
        res
          .status(500)
          .json({ message: "Error creating subscription: " + error.message });
      }
    },
  );

  // Get user's current subscription
  app.get("/api/my-subscription", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const subscription = await storage.getUserSubscription(userId);
      if (!subscription) {
        return res.json({ subscription: null });
      }

      const plan = await storage.getSubscriptionPlan(subscription.planId);
      res.json({
        subscription: {
          ...subscription,
          plan,
        },
      });
    } catch (error: any) {
      console.error("Error fetching subscription:", error);
      res
        .status(500)
        .json({ message: "Error fetching subscription: " + error.message });
    }
  });

  // Upgrade/change subscription plan
  app.post(
    "/api/upgrade-subscription",
    authenticateToken,
    async (req: any, res) => {
      try {
        const { planId, billingCycle } = billingInfoSchema.parse(req.body);
        const user = req.user;

        // Get current subscription
        const currentSubscription = await storage.getUserSubscription(user.id);
        if (!currentSubscription) {
          return res
            .status(404)
            .json({ message: "No active subscription found" });
        }

        // Get the new plan
        const newPlan = await storage.getSubscriptionPlan(planId);
        if (!newPlan) {
          return res
            .status(404)
            .json({ message: "Subscription plan not found" });
        }

        // Get current plan for comparison
        const currentPlan = await storage.getSubscriptionPlan(
          currentSubscription.planId,
        );

        // Determine the new price ID based on billing cycle
        const newPriceId =
          billingCycle === "yearly"
            ? newPlan.stripeYearlyPriceId || newPlan.stripePriceId
            : newPlan.stripePriceId;

        try {
          // Update the Stripe subscription
          const updatedStripeSubscription = await stripe.subscriptions.update(
            currentSubscription.stripeSubscriptionId,
            {
              items: [
                {
                  id: (
                    await stripe.subscriptions.retrieve(
                      currentSubscription.stripeSubscriptionId,
                    )
                  ).items.data[0].id,
                  price: newPriceId,
                },
              ],
              proration_behavior: "always_invoice", // Create prorated invoice immediately
            },
          );

          // Helper function to safely convert Stripe timestamps to dates
          const safeTimestampToDate = (timestamp: any): Date | null => {
            if (!timestamp || typeof timestamp !== "number") return null;
            const date = new Date(timestamp * 1000);
            return isNaN(date.getTime()) ? null : date;
          };

          // Update subscription in database
          await storage.updateSubscription(currentSubscription.id, {
            planId: newPlan.id,
            status: updatedStripeSubscription.status,
            currentPeriodStart:
              safeTimestampToDate(
                (updatedStripeSubscription as any).current_period_start,
              ) || new Date(),
            currentPeriodEnd:
              safeTimestampToDate(
                (updatedStripeSubscription as any).current_period_end,
              ) || new Date(),
            isYearly: billingCycle === "yearly",
          });

          res.json({
            message: "Subscription updated successfully",
            subscription: {
              id: currentSubscription.id,
              status: updatedStripeSubscription.status,
              planId: newPlan.id,
              planName: newPlan.displayName,
            },
          });
        } catch (stripeError: any) {
          console.error("Stripe subscription update error:", stripeError);
          res.status(400).json({
            message:
              "Failed to update subscription: " +
              (stripeError.message || "Unknown error"),
          });
        }
      } catch (error: any) {
        console.error("Error upgrading subscription:", error);
        res
          .status(500)
          .json({ message: "Error upgrading subscription: " + error.message });
      }
    },
  );

  // Forms API Routes (tenant-aware)

  // Get user's forms
  app.get("/api/forms", authenticateToken, async (req: any, res) => {
    try {
      const forms = await storage.getUserForms(req.user.id, req.user.tenantId);
      res.json({ forms });
    } catch (error) {
      console.error("Get forms error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get tenant forms (for admin/manager)
  app.get(
    "/api/forms/tenant",
    authenticateToken,
    requireManagerOrAdmin,
    async (req: any, res) => {
      try {
        const forms = await storage.getTenantForms(req.user.tenantId);
        res.json({ forms });
      } catch (error) {
        console.error("Get tenant forms error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Get specific form
  app.get("/api/forms/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const form = await storage.getForm(id, req.user.tenantId);

      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }

      res.json({ form });
    } catch (error) {
      console.error("Get form error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new form
  app.post("/api/forms", authenticateToken, async (req: any, res) => {
    try {
      const formData = req.body; // Already validated by DragFormMaster

      const form = await storage.createForm(
        formData,
        req.user.id,
        req.user.tenantId,
      );

      res.status(201).json({
        message: "Form created successfully",
        form,
      });
    } catch (error) {
      console.error("Create form error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update form
  app.put("/api/forms/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const formData = req.body;

      // Check if form exists and belongs to user's tenant
      const existingForm = await storage.getForm(id, req.user.tenantId);
      if (!existingForm) {
        return res.status(404).json({ message: "Form not found" });
      }

      const updatedForm = await storage.updateForm(
        id,
        formData,
        req.user.tenantId,
      );

      res.json({
        message: "Form updated successfully",
        form: updatedForm,
      });
    } catch (error) {
      console.error("Update form error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete form
  app.delete("/api/forms/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;

      // Check if form exists and belongs to user's tenant
      const existingForm = await storage.getForm(id, req.user.tenantId);
      if (!existingForm) {
        return res.status(404).json({ message: "Form not found" });
      }

      await storage.deleteForm(id, req.user.tenantId);

      res.json({ message: "Form deleted successfully" });
    } catch (error) {
      console.error("Delete form error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get form responses
  app.get(
    "/api/forms/:id/responses",
    authenticateToken,
    async (req: any, res) => {
      try {
        const { id } = req.params;

        // Check if form exists and belongs to user's tenant
        const form = await storage.getForm(id, req.user.tenantId);
        if (!form) {
          return res.status(404).json({ message: "Form not found" });
        }

        const responses = await storage.getFormResponses(id, req.user.tenantId);
        const responseCount = await storage.getFormResponseCount(
          id,
          req.user.tenantId,
        );

        res.json({ responses, responseCount });
      } catch (error) {
        console.error("Get form responses error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  const httpServer = createServer(app);
  return httpServer;
}
