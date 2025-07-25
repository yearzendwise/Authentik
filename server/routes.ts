import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import { loginSchema, registerSchema, forgotPasswordSchema, updateProfileSchema, changePasswordSchema, enable2FASchema, disable2FASchema, verifyEmailSchema, resendVerificationSchema } from "@shared/schema";
import { randomBytes } from "crypto";
import { authenticator } from "otplib";
import * as QRCode from "qrcode";
import { UAParser } from "ua-parser-js";
import { createHash } from "crypto";
import { emailService } from "./emailService";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "your-super-secret-refresh-key";

// Utility function to extract device information from request
function getDeviceInfo(req: any): { deviceId: string; deviceName: string; userAgent?: string; ipAddress?: string } {
  const userAgentString = req.get("User-Agent") || "Unknown";
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();
  
  // Create a unique device identifier based on user agent and IP
  const deviceFingerprint = `${result.browser.name}-${result.os.name}-${req.ip}`;
  const deviceId = createHash("sha256").update(deviceFingerprint).digest("hex").substring(0, 16);
  
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
    const user = await storage.getUser(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Access token expired" });
    }
    return res.status(403).json({ message: "Invalid access token" });
  }
};

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
  const refreshToken = jwt.sign({ userId, tokenId: randomBytes(16).toString('hex') }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES });
  return { accessToken, refreshToken };
};

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(cookieParser());

  // Clean up expired tokens periodically
  setInterval(async () => {
    try {
      await storage.cleanExpiredTokens();
    } catch (error) {
      console.error("Failed to clean expired tokens:", error);
    }
  }, 24 * 60 * 60 * 1000); // Once per day

  // Register endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User already exists with this email" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 12);

      // Create user
      const user = await storage.createUser({
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
      });

      // Generate email verification token
      const verificationToken = randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Set verification token in database
      await storage.setEmailVerificationToken(user.id, verificationToken, verificationExpires);

      // Send verification email
      try {
        await emailService.sendVerificationEmail(user.email, verificationToken, user.firstName || undefined);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Continue with registration, console URL is already logged
      }

      res.status(201).json({
        message: "User created successfully. Please check the server console for the verification URL since email delivery is restricted.",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: false,
        },
        developmentNote: "Check server console for verification URL"
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

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, twoFactorToken } = loginSchema.parse(req.body);

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Allow login but mark verification status
      const emailVerificationRequired = !user.emailVerified;

      // Check 2FA if enabled
      if (user.twoFactorEnabled) {
        if (!twoFactorToken) {
          return res.status(200).json({ 
            message: "2FA token required",
            requires2FA: true,
            tempLoginId: user.id // In production, use a temporary encrypted token
          });
        }

        if (!user.twoFactorSecret) {
          return res.status(500).json({ message: "2FA configuration error" });
        }

        const isValid2FA = authenticator.verify({
          token: twoFactorToken,
          secret: user.twoFactorSecret,
        });

        if (!isValid2FA) {
          return res.status(401).json({ message: "Invalid 2FA token" });
        }
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id);

      // Get device information
      const deviceInfo = getDeviceInfo(req);

      // Store refresh token in database with device info
      const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await storage.createRefreshToken(user.id, refreshToken, refreshTokenExpiry, deviceInfo);

      // Set refresh token as httpOnly cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
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
          message: "Invalid or expired verification token. Please request a new verification email." 
        });
      }

      // Verify the user's email
      await storage.verifyUserEmail(user.id);

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(user.email, user.firstName || undefined);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Continue even if welcome email fails
      }

      res.json({
        message: "Email verified successfully! You can now log in to your account.",
        verified: true
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

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Check rate limiting - 5 minutes between resend requests
      if (user.lastVerificationEmailSent) {
        const timeSinceLastSent = Date.now() - user.lastVerificationEmailSent.getTime();
        const fiveMinutesInMs = 5 * 60 * 1000;
        
        if (timeSinceLastSent < fiveMinutesInMs) {
          const remainingTime = Math.ceil((fiveMinutesInMs - timeSinceLastSent) / 1000 / 60);
          return res.status(429).json({ 
            message: `Please wait ${remainingTime} minute(s) before requesting another verification email.`,
            retryAfter: remainingTime
          });
        }
      }

      // Generate new verification token
      const verificationToken = randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update verification token in database
      await storage.setEmailVerificationToken(user.id, verificationToken, verificationExpires);

      // Send verification email
      try {
        await emailService.sendVerificationEmail(user.email, verificationToken, user.firstName || undefined);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        return res.status(500).json({ message: "Failed to send verification email" });
      }

      res.json({
        message: "Verification email sent successfully. Please check your inbox.",
        nextAllowedAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
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

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Verify the user's email directly
      await storage.verifyUserEmail(user.id);

      res.json({
        message: "Email verified successfully! (Development mode)",
        verified: true
      });
    } catch (error: any) {
      console.error("Dev email verification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Refresh token endpoint
  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token required" });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as any;
      
      // Check if refresh token exists in database and is not expired
      const storedToken = await storage.getRefreshToken(refreshToken);
      if (!storedToken) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }

      // Get user
      const user = await storage.getUser(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "User not found or inactive" });
      }

      // Update session last used time
      await storage.updateSessionLastUsed(refreshToken);

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

      // Get device info to preserve it in the new token
      const deviceInfo = getDeviceInfo(req);

      // Remove old refresh token and store new one with preserved device info
      await storage.deleteRefreshToken(refreshToken);
      const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await storage.createRefreshToken(user.id, newRefreshToken, refreshTokenExpiry, {
        deviceId: storedToken.deviceId || deviceInfo.deviceId,
        deviceName: storedToken.deviceName || deviceInfo.deviceName,
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
      });

      // Set new refresh token as httpOnly cookie
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        message: "Token refreshed successfully",
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
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

  // Get current user endpoint
  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        twoFactorEnabled: req.user.twoFactorEnabled,
        emailVerified: req.user.emailVerified,
      },
    });
  });

  // Logout from all devices
  app.post("/api/auth/logout-all", authenticateToken, async (req: any, res) => {
    try {
      await storage.deleteUserRefreshTokens(req.user.id);
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
      const updateData = updateProfileSchema.parse(req.body);
      
      // Check if email is already taken by another user
      if (updateData.email !== req.user.email) {
        const existingUser = await storage.getUserByEmail(updateData.email);
        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(409).json({ message: "Email already taken by another user" });
        }
      }

      const updatedUser = await storage.updateUser(req.user.id, updateData);
      
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

  // Change password endpoint
  app.put("/api/auth/change-password", authenticateToken, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, req.user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      const updatedUser = await storage.updateUser(req.user.id, { password: hashedPassword });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Revoke all refresh tokens to force re-authentication on all devices
      await storage.deleteUserRefreshTokens(req.user.id);

      res.json({ message: "Password changed successfully. Please log in again." });
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
  });

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
      await storage.updateUser(req.user.id, { twoFactorSecret: secret });

      res.json({
        secret,
        qrCode: qrCodeDataUrl,
        backupCodes: [] // In production, generate backup codes
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
      await storage.updateUser(req.user.id, { twoFactorEnabled: true });

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
  app.post("/api/auth/2fa/disable", authenticateToken, async (req: any, res) => {
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
      await storage.updateUser(req.user.id, { 
        twoFactorEnabled: false,
        twoFactorSecret: null
      });

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
  });

  // Delete account endpoint
  app.delete("/api/auth/account", authenticateToken, async (req: any, res) => {
    try {
      // Deactivate user instead of deleting
      const updatedUser = await storage.updateUser(req.user.id, { isActive: false });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Revoke all refresh tokens
      await storage.deleteUserRefreshTokens(req.user.id);
      
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
      
      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ message: "If the email exists, a reset link has been sent" });
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
      const sessions = await storage.getUserSessions(req.user.id);
      
      // Get current session token to mark it as current
      const currentRefreshToken = req.cookies.refreshToken;
      
      const sessionData = sessions.map(session => ({
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
  app.delete("/api/auth/sessions/:sessionId", authenticateToken, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;
      
      await storage.deleteSession(sessionId, userId);
      
      res.json({ message: "Session deleted successfully" });
    } catch (error) {
      console.error("Delete session error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete all other sessions (logout from all other devices)
  app.delete("/api/auth/sessions", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentRefreshToken = req.cookies.refreshToken;
      
      // Get all user sessions
      const sessions = await storage.getUserSessions(userId);
      
      // Delete all sessions except the current one
      for (const session of sessions) {
        if (session.token !== currentRefreshToken) {
          await storage.deleteSession(session.id, userId);
        }
      }
      
      res.json({ message: "All other sessions logged out successfully" });
    } catch (error) {
      console.error("Delete all sessions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
