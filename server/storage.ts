import { 
  users, 
  refreshTokens, 
  subscriptionPlans, 
  subscriptions,
  tenants,
  forms,
  formResponses,
  verificationTokens,
  companies,
  type User, 
  type InsertUser, 
  type RefreshToken, 
  type UserFilters, 
  type CreateUserData, 
  type UpdateUserData, 
  type SubscriptionPlan, 
  type InsertSubscriptionPlan, 
  type Subscription, 
  type InsertSubscription,
  type Tenant,
  type InsertTenant,
  type CreateTenantData,
  type UpdateTenantData,
  type Form,
  type InsertForm,
  type CreateFormData,
  type UpdateFormData,
  type FormResponse,
  type InsertFormResponse,
  type SubmitFormResponseData,
  type UserWithTenant,
  type FormWithDetails,
  type Company,
  type InsertCompany,
  type CreateCompanyData,
  type UpdateCompanyData
} from "@shared/schema";
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
  // Tenant operations
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantBySlug(slug: string): Promise<Tenant | undefined>;
  createTenant(tenant: CreateTenantData): Promise<Tenant>;
  updateTenant(id: string, updates: UpdateTenantData): Promise<Tenant | undefined>;
  
  // User operations (now tenant-aware)
  getUser(id: string, tenantId: string): Promise<User | undefined>;
  getUserByEmail(email: string, tenantId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>, tenantId: string): Promise<User | undefined>;
  
  // User management operations (tenant-aware)
  getAllUsers(tenantId: string, filters?: UserFilters): Promise<User[]>;
  getUserStats(tenantId: string): Promise<{ totalUsers: number; activeUsers: number; usersByRole: Record<string, number> }>;
  createUserAsAdmin(userData: CreateUserData, tenantId: string): Promise<User>;
  updateUserAsAdmin(id: string, userData: UpdateUserData, tenantId: string): Promise<User | undefined>;
  deleteUser(id: string, tenantId: string): Promise<void>;
  toggleUserStatus(id: string, isActive: boolean, tenantId: string): Promise<User | undefined>;
  
  // Refresh token operations with device tracking (tenant-aware)
  createRefreshToken(userId: string, tenantId: string, token: string, expiresAt: Date, deviceInfo?: DeviceInfo): Promise<RefreshToken>;
  getRefreshToken(token: string): Promise<RefreshToken | undefined>;
  updateRefreshToken(id: string, token: string): Promise<void>;
  deleteRefreshToken(token: string): Promise<void>;
  deleteUserRefreshTokens(userId: string, tenantId: string): Promise<void>;
  cleanExpiredTokens(): Promise<void>;
  
  // Device session management (tenant-aware)
  getUserSessions(userId: string, tenantId: string): Promise<RefreshToken[]>;
  updateSessionLastUsed(token: string): Promise<void>;
  deleteSession(sessionId: string, userId: string, tenantId: string): Promise<void>;
  deleteAllUserSessions(userId: string, tenantId: string): Promise<void>;
  deleteOtherUserSessions(userId: string, currentRefreshToken: string, tenantId: string): Promise<void>;
  refreshTokenExists(refreshTokenId: string): Promise<boolean>;
  
  // Email verification (tenant-aware)
  setEmailVerificationToken(userId: string, tenantId: string, token: string, expiresAt: Date): Promise<void>;
  getUserByEmailVerificationToken(token: string): Promise<User | undefined>;
  verifyUserEmail(userId: string, tenantId: string): Promise<void>;
  updateLastVerificationEmailSent(userId: string, tenantId: string): Promise<void>;
  
  // Forms operations (tenant-aware)
  createForm(formData: CreateFormData, userId: string, tenantId: string): Promise<Form>;
  getForm(id: string, tenantId: string): Promise<Form | undefined>;
  getUserForms(userId: string, tenantId: string): Promise<Form[]>;
  getTenantForms(tenantId: string): Promise<FormWithDetails[]>;
  updateForm(id: string, updates: UpdateFormData, tenantId: string): Promise<Form | undefined>;
  deleteForm(id: string, tenantId: string): Promise<void>;
  
  // Form responses operations (tenant-aware)
  submitFormResponse(responseData: SubmitFormResponseData, tenantId: string): Promise<FormResponse>;
  getFormResponses(formId: string, tenantId: string): Promise<FormResponse[]>;
  getFormResponseCount(formId: string, tenantId: string): Promise<number>;
  
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
  // Tenant operations
  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async getTenantBySlug(slug: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug));
    return tenant;
  }

  async createTenant(tenantData: CreateTenantData): Promise<Tenant> {
    const [tenant] = await db.insert(tenants).values(tenantData).returning();
    return tenant;
  }

  async updateTenant(id: string, updates: UpdateTenantData): Promise<Tenant | undefined> {
    const [tenant] = await db.update(tenants)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return tenant;
  }

  // User operations (tenant-aware)
  async getUser(id: string, tenantId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users)
      .where(and(eq(users.id, id), eq(users.tenantId, tenantId)));
    return user;
  }

  async getUserByEmail(email: string, tenantId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users)
      .where(and(eq(users.email, email), eq(users.tenantId, tenantId)));
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

  async updateUser(id: string, updates: Partial<User>, tenantId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(users.id, id), eq(users.tenantId, tenantId)))
      .returning();
    return user;
  }

  async createRefreshToken(userId: string, tenantId: string, token: string, expiresAt: Date, deviceInfo?: DeviceInfo): Promise<RefreshToken> {
    const [refreshToken] = await db
      .insert(refreshTokens)
      .values({
        userId,
        tenantId,
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

  async deleteUserRefreshTokens(userId: string, tenantId: string): Promise<void> {
    await db.delete(refreshTokens).where(and(
      eq(refreshTokens.userId, userId),
      eq(refreshTokens.tenantId, tenantId)
    ));
  }

  async cleanExpiredTokens(): Promise<void> {
    await db.delete(refreshTokens).where(
      gt(refreshTokens.expiresAt, new Date())
    );
  }

  // Device session management methods
  async getUserSessions(userId: string, tenantId: string): Promise<RefreshToken[]> {
    const sessions = await db
      .select()
      .from(refreshTokens)
      .where(and(
        eq(refreshTokens.userId, userId),
        eq(refreshTokens.tenantId, tenantId),
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

  async deleteSession(sessionId: string, userId: string, tenantId: string): Promise<void> {
    await db
      .delete(refreshTokens)
      .where(and(
        eq(refreshTokens.id, sessionId),
        eq(refreshTokens.userId, userId),
        eq(refreshTokens.tenantId, tenantId)
      ));
  }

  async deleteAllUserSessions(userId: string, tenantId: string): Promise<void> {
    await db
      .delete(refreshTokens)
      .where(and(
        eq(refreshTokens.userId, userId),
        eq(refreshTokens.tenantId, tenantId)
      ));
  }

  async deleteOtherUserSessions(userId: string, currentRefreshToken: string, tenantId: string): Promise<void> {
    await db
      .delete(refreshTokens)
      .where(and(
        eq(refreshTokens.userId, userId),
        eq(refreshTokens.tenantId, tenantId),
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

  // Email verification methods (tenant-aware)
  async setEmailVerificationToken(userId: string, tenantId: string, token: string, expiresAt: Date): Promise<void> {
    await db
      .update(users)
      .set({ 
        emailVerificationToken: token,
        emailVerificationExpires: expiresAt,
        lastVerificationEmailSent: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)));
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

  async verifyUserEmail(userId: string, tenantId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: new Date()
      })
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)));
  }

  async updateLastVerificationEmailSent(userId: string, tenantId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        lastVerificationEmailSent: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)));
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

  // Forms operations (tenant-aware)
  async createForm(formData: CreateFormData, userId: string, tenantId: string): Promise<Form> {
    const [form] = await db
      .insert(forms)
      .values({
        ...formData,
        userId,
        tenantId,
        updatedAt: new Date(),
      })
      .returning();
    return form;
  }

  async getForm(id: string, tenantId: string): Promise<Form | undefined> {
    const [form] = await db.select().from(forms)
      .where(and(eq(forms.id, id), eq(forms.tenantId, tenantId)));
    return form;
  }

  async getUserForms(userId: string, tenantId: string): Promise<Form[]> {
    return await db.select().from(forms)
      .where(and(eq(forms.userId, userId), eq(forms.tenantId, tenantId)))
      .orderBy(desc(forms.createdAt));
  }

  async getTenantForms(tenantId: string): Promise<FormWithDetails[]> {
    return await db.select({
      id: forms.id,
      tenantId: forms.tenantId,
      userId: forms.userId,
      title: forms.title,
      description: forms.description,
      formData: forms.formData,
      theme: forms.theme,
      isActive: forms.isActive,
      responseCount: forms.responseCount,
      createdAt: forms.createdAt,
      updatedAt: forms.updatedAt,
      user: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      },
      tenant: {
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
      }
    })
    .from(forms)
    .innerJoin(users, eq(forms.userId, users.id))
    .innerJoin(tenants, eq(forms.tenantId, tenants.id))
    .where(eq(forms.tenantId, tenantId))
    .orderBy(desc(forms.createdAt)) as FormWithDetails[];
  }

  async updateForm(id: string, updates: UpdateFormData, tenantId: string): Promise<Form | undefined> {
    const [form] = await db
      .update(forms)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(forms.id, id), eq(forms.tenantId, tenantId)))
      .returning();
    return form;
  }

  async deleteForm(id: string, tenantId: string): Promise<void> {
    await db.delete(forms).where(and(eq(forms.id, id), eq(forms.tenantId, tenantId)));
  }

  // Form responses operations (tenant-aware)
  async submitFormResponse(responseData: SubmitFormResponseData, tenantId: string): Promise<FormResponse> {
    const [response] = await db
      .insert(formResponses)
      .values({
        ...responseData,
        tenantId,
      })
      .returning();
    
    // Update response count
    await db
      .update(forms)
      .set({ 
        responseCount: sql`${forms.responseCount} + 1`,
        updatedAt: new Date()
      })
      .where(and(eq(forms.id, responseData.formId), eq(forms.tenantId, tenantId)));
    
    return response;
  }

  async getFormResponses(formId: string, tenantId: string): Promise<FormResponse[]> {
    return await db.select().from(formResponses)
      .where(and(eq(formResponses.formId, formId), eq(formResponses.tenantId, tenantId)))
      .orderBy(desc(formResponses.submittedAt));
  }

  async getFormResponseCount(formId: string, tenantId: string): Promise<number> {
    const [result] = await db.select({ count: count() }).from(formResponses)
      .where(and(eq(formResponses.formId, formId), eq(formResponses.tenantId, tenantId)));
    return result.count;
  }

  // User management methods (tenant-aware)
  async getAllUsers(tenantId: string, filters?: UserFilters): Promise<User[]> {
    const conditions = [eq(users.tenantId, tenantId)];

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(users.firstName, searchTerm),
          ilike(users.lastName, searchTerm),
          ilike(users.email, searchTerm)
        )!
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

    const whereClause = and(...conditions);
    
    const result = await db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt));
    
    return result;
  }

  async getUserStats(tenantId: string): Promise<{ totalUsers: number; activeUsers: number; usersByRole: Record<string, number> }> {
    // Get total and active user counts for tenant
    const [totalResult] = await db.select({ count: count() }).from(users).where(eq(users.tenantId, tenantId));
    const [activeResult] = await db.select({ count: count() }).from(users)
      .where(and(eq(users.tenantId, tenantId), eq(users.isActive, true)));

    // Get user counts by role for tenant
    const roleResults = await db
      .select({ 
        role: users.role, 
        count: count() 
      })
      .from(users)
      .where(and(eq(users.tenantId, tenantId), eq(users.isActive, true)))
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

  async createUserAsAdmin(userData: CreateUserData, tenantId: string): Promise<User> {
    const { confirmPassword, ...userInsertData } = userData;
    const [user] = await db
      .insert(users)
      .values({
        ...userInsertData,
        tenantId,
        emailVerified: true, // Admin-created users are automatically verified
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUserAsAdmin(id: string, userData: UpdateUserData, tenantId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(and(eq(users.id, id), eq(users.tenantId, tenantId)))
      .returning();
    return user;
  }

  async deleteUser(id: string, tenantId: string): Promise<void> {
    // First delete all refresh tokens
    await db.delete(refreshTokens).where(and(eq(refreshTokens.userId, id), eq(refreshTokens.tenantId, tenantId)));
    // Then delete the user
    await db.delete(users).where(and(eq(users.id, id), eq(users.tenantId, tenantId)));
  }

  async toggleUserStatus(id: string, isActive: boolean, tenantId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(and(eq(users.id, id), eq(users.tenantId, tenantId)))
      .returning();
    return user;
  }

  // Company management methods (tenant-aware)
  async getAllCompanies(tenantId: string): Promise<(Company & { owner: User })[]> {
    const result = await db
      .select({
        id: companies.id,
        tenantId: companies.tenantId,
        ownerId: companies.ownerId,
        name: companies.name,
        address: companies.address,
        companyType: companies.companyType,
        companyEmail: companies.companyEmail,
        phone: companies.phone,
        website: companies.website,
        description: companies.description,
        isActive: companies.isActive,
        createdAt: companies.createdAt,
        updatedAt: companies.updatedAt,
        owner: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(companies)
      .innerJoin(users, eq(companies.ownerId, users.id))
      .where(eq(companies.tenantId, tenantId))
      .orderBy(desc(companies.createdAt));
    
    return result;
  }

  async getCompany(id: string, tenantId: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(and(eq(companies.id, id), eq(companies.tenantId, tenantId)));
    return company;
  }

  async createCompany(companyData: CreateCompanyData, ownerId: string, tenantId: string): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values({
        ...companyData,
        ownerId,
        tenantId,
        updatedAt: new Date(),
      })
      .returning();
    return company;
  }

  async updateCompany(id: string, companyData: UpdateCompanyData, tenantId: string): Promise<Company | undefined> {
    const [company] = await db
      .update(companies)
      .set({ ...companyData, updatedAt: new Date() })
      .where(and(eq(companies.id, id), eq(companies.tenantId, tenantId)))
      .returning();
    return company;
  }

  async deleteCompany(id: string, tenantId: string): Promise<void> {
    await db.delete(companies).where(and(eq(companies.id, id), eq(companies.tenantId, tenantId)));
  }


}

export const storage = new DatabaseStorage();
