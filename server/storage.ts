import { users, refreshTokens, subscriptionPlans, subscriptions, type User, type InsertUser, type RefreshToken, type UserFilters, type CreateUserData, type UpdateUserData, type SubscriptionPlan, type InsertSubscriptionPlan, type Subscription, type InsertSubscription } from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, desc, ne, or, ilike, count, sql } from "drizzle-orm";

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
  
  // User management operations
  getAllUsers(filters?: UserFilters): Promise<User[]>;
  getUserStats(): Promise<{ totalUsers: number; activeUsers: number; usersByRole: Record<string, number> }>;
  createUserAsAdmin(userData: CreateUserData): Promise<User>;
  updateUserAsAdmin(id: string, userData: UpdateUserData): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  toggleUserStatus(id: string, isActive: boolean): Promise<User | undefined>;
  
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
  
  // Subscription plans
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  
  // User subscriptions
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscription(id: string): Promise<Subscription | undefined>;
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | undefined>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<void>;
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

  // Subscription plans methods
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true)).orderBy(subscriptionPlans.sortOrder);
  }

  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [newPlan] = await db
      .insert(subscriptionPlans)
      .values({
        ...plan,
        updatedAt: new Date(),
      })
      .returning();
    return newPlan;
  }

  // User subscriptions methods
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db
      .insert(subscriptions)
      .values({
        ...subscription,
        updatedAt: new Date(),
      })
      .returning();
    return newSubscription;
  }

  async getSubscription(id: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return subscription;
  }

  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).orderBy(desc(subscriptions.createdAt));
    return subscription;
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<void> {
    await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        subscriptionStatus: 'active',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // User management methods
  async getAllUsers(filters?: UserFilters): Promise<User[]> {
    const conditions = [];

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(users.firstName, searchTerm),
          ilike(users.lastName, searchTerm),
          ilike(users.email, searchTerm)
        )
      );
    }

    if (filters?.role) {
      conditions.push(eq(users.role, filters.role));
    }

    if (filters?.status === 'active') {
      conditions.push(eq(users.isActive, true));
    } else if (filters?.status === 'inactive') {
      conditions.push(eq(users.isActive, false));
    } else if (!filters?.showInactive) {
      conditions.push(eq(users.isActive, true));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const result = await db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt));
    
    return result;
  }

  async getUserStats(): Promise<{ totalUsers: number; activeUsers: number; usersByRole: Record<string, number> }> {
    // Get total and active user counts
    const [totalResult] = await db.select({ count: count() }).from(users);
    const [activeResult] = await db.select({ count: count() }).from(users).where(eq(users.isActive, true));

    // Get user counts by role
    const roleResults = await db
      .select({ 
        role: users.role, 
        count: count() 
      })
      .from(users)
      .where(eq(users.isActive, true))
      .groupBy(users.role);

    const usersByRole: Record<string, number> = {};
    roleResults.forEach(result => {
      usersByRole[result.role] = result.count;
    });

    return {
      totalUsers: totalResult.count,
      activeUsers: activeResult.count,
      usersByRole
    };
  }

  async createUserAsAdmin(userData: CreateUserData): Promise<User> {
    const { confirmPassword, ...userInsertData } = userData;
    const [user] = await db
      .insert(users)
      .values({
        ...userInsertData,
        emailVerified: true, // Admin-created users are automatically verified
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUserAsAdmin(id: string, userData: UpdateUserData): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    // First delete all refresh tokens
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, id));
    // Then delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  async toggleUserStatus(id: string, isActive: boolean): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
