import { users, refreshTokens, type User, type InsertUser, type RefreshToken } from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, desc, ne } from "drizzle-orm";

export interface DeviceInfo {
  deviceId?: string;
  deviceName?: string;
  userAgent?: string;
  ipAddress?: string;
  location?: string;
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Refresh token operations with device tracking
  createRefreshToken(userId: string, token: string, expiresAt: Date, deviceInfo?: DeviceInfo): Promise<RefreshToken>;
  getRefreshToken(token: string): Promise<RefreshToken | undefined>;
  updateRefreshToken(id: string, token: string): Promise<void>;
  deleteRefreshToken(token: string): Promise<void>;
  deleteUserRefreshTokens(userId: string): Promise<void>;
  cleanExpiredTokens(): Promise<void>;
  
  // Device session management
  getUserSessions(userId: string): Promise<RefreshToken[]>;
  updateSessionLastUsed(token: string): Promise<void>;
  deleteSession(sessionId: string, userId: string): Promise<void>;
  deleteAllUserSessions(userId: string): Promise<void>;
  deleteOtherUserSessions(userId: string, currentRefreshToken: string): Promise<void>;
  refreshTokenExists(refreshTokenId: string): Promise<boolean>;
  
  // Email verification
  setEmailVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  getUserByEmailVerificationToken(token: string): Promise<User | undefined>;
  verifyUserEmail(userId: string): Promise<void>;
  updateLastVerificationEmailSent(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createRefreshToken(userId: string, token: string, expiresAt: Date, deviceInfo?: DeviceInfo): Promise<RefreshToken> {
    const [refreshToken] = await db
      .insert(refreshTokens)
      .values({
        userId,
        token,
        expiresAt,
        deviceId: deviceInfo?.deviceId,
        deviceName: deviceInfo?.deviceName,
        userAgent: deviceInfo?.userAgent,
        ipAddress: deviceInfo?.ipAddress,
        location: deviceInfo?.location,
        lastUsed: new Date(),
        isActive: true,
      })
      .returning();
    return refreshToken;
  }

  async getRefreshToken(token: string): Promise<RefreshToken | undefined> {
    const [refreshToken] = await db
      .select()
      .from(refreshTokens)
      .where(and(
        eq(refreshTokens.token, token),
        gt(refreshTokens.expiresAt, new Date())
      ));
    return refreshToken;
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
  }

  async deleteUserRefreshTokens(userId: string): Promise<void> {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
  }

  async cleanExpiredTokens(): Promise<void> {
    await db.delete(refreshTokens).where(
      gt(refreshTokens.expiresAt, new Date())
    );
  }

  // Device session management methods
  async getUserSessions(userId: string): Promise<RefreshToken[]> {
    const sessions = await db
      .select()
      .from(refreshTokens)
      .where(and(
        eq(refreshTokens.userId, userId),
        eq(refreshTokens.isActive, true),
        gt(refreshTokens.expiresAt, new Date())
      ))
      .orderBy(desc(refreshTokens.lastUsed));
    return sessions;
  }

  async updateSessionLastUsed(token: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ lastUsed: new Date() })
      .where(eq(refreshTokens.token, token));
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    await db
      .delete(refreshTokens)
      .where(and(
        eq(refreshTokens.id, sessionId),
        eq(refreshTokens.userId, userId)
      ));
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    await db
      .delete(refreshTokens)
      .where(eq(refreshTokens.userId, userId));
  }

  async deleteOtherUserSessions(userId: string, currentRefreshToken: string): Promise<void> {
    await db
      .delete(refreshTokens)
      .where(and(
        eq(refreshTokens.userId, userId),
        ne(refreshTokens.token, currentRefreshToken)
      ));
  }

  async updateRefreshToken(id: string, token: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ token })
      .where(eq(refreshTokens.id, id));
  }

  async refreshTokenExists(refreshTokenId: string): Promise<boolean> {
    const [token] = await db
      .select({ id: refreshTokens.id })
      .from(refreshTokens)
      .where(and(
        eq(refreshTokens.id, refreshTokenId),
        eq(refreshTokens.isActive, true),
        gt(refreshTokens.expiresAt, new Date())
      ))
      .limit(1);
    return !!token;
  }

  // Email verification methods
  async setEmailVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await db
      .update(users)
      .set({ 
        emailVerificationToken: token,
        emailVerificationExpires: expiresAt,
        lastVerificationEmailSent: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async getUserByEmailVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.emailVerificationToken, token),
        gt(users.emailVerificationExpires, new Date())
      ));
    return user;
  }

  async verifyUserEmail(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateLastVerificationEmailSent(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        lastVerificationEmailSent: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();
