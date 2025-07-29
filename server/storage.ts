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
  shops,
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
  type RegisterOwnerData,
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
  type UpdateCompanyData,
  type Shop,
  type InsertShop,
  type CreateShopData,
  type UpdateShopData,
  type ShopFilters,
  type ShopWithManager
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, lt, desc, ne, or, ilike, count, sql } from "drizzle-orm";

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
  
  // Special Owner registration operation that creates both tenant and Owner user
  createOwnerAndTenant(ownerData: RegisterOwnerData): Promise<{ owner: User; tenant: Tenant }>;
  
  // Method to find the Owner of a tenant (for login logic)
  getTenantOwner(tenantId: string): Promise<User | undefined>;
  
  // Method to find a user by email across all tenants (for login)
  findUserByEmailAcrossTenants(email: string): Promise<(User & { tenant: { id: string; name: string; slug: string } }) | undefined>;
  
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
  
  // SaaS Limits and Validation
  getTenantSubscription(tenantId: string): Promise<(Subscription & { plan: SubscriptionPlan }) | undefined>;
  checkUserLimits(tenantId: string): Promise<{ canAddUser: boolean; currentUsers: number; maxUsers: number | null; planName: string }>;
  validateUserCreation(tenantId: string): Promise<void>;
  checkShopLimits(tenantId: string): Promise<{ canAddShop: boolean; currentShops: number; maxShops: number | null; planName: string }>;
  validateShopCreation(tenantId: string): Promise<void>;
  
  // Shop operations (tenant-aware)
  getShop(id: string, tenantId: string): Promise<Shop | undefined>;
  getShopWithManager(id: string, tenantId: string): Promise<ShopWithManager | undefined>;
  getAllShops(tenantId: string, filters?: ShopFilters): Promise<ShopWithManager[]>;
  getShopsByManager(managerId: string, tenantId: string): Promise<Shop[]>;
  createShop(shop: CreateShopData, tenantId: string): Promise<Shop>;
  updateShop(id: string, updates: UpdateShopData, tenantId: string): Promise<Shop | undefined>;
  deleteShop(id: string, tenantId: string): Promise<void>;
  toggleShopStatus(id: string, isActive: boolean, tenantId: string): Promise<Shop | undefined>;
  getShopStats(tenantId: string): Promise<{ totalShops: number; activeShops: number; shopsByCategory: Record<string, number> }>;
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

  // Special Owner registration operation that creates both tenant and Owner user
  async createOwnerAndTenant(ownerData: RegisterOwnerData): Promise<{ owner: User; tenant: Tenant }> {
    // Start a transaction to ensure both tenant and owner are created or none
    const result = await db.transaction(async (tx) => {
      // Create the tenant first
      const [tenant] = await tx.insert(tenants).values({
        name: ownerData.organizationName,
        slug: ownerData.organizationSlug,
        isActive: true,
        maxUsers: 10, // Default max users for new organizations
      }).returning();

      // Create the owner user
      const [owner] = await tx.insert(users).values({
        tenantId: tenant.id,
        email: ownerData.email,
        password: ownerData.password, // This should be hashed before calling this method
        firstName: ownerData.firstName,
        lastName: ownerData.lastName,
        role: 'Owner',
        isActive: true,
        emailVerified: false, // Owner still needs to verify email
        updatedAt: new Date(),
      }).returning();

      return { owner, tenant };
    });

    return result;
  }

  // Method to find the Owner of a tenant (for login logic)
  async getTenantOwner(tenantId: string): Promise<User | undefined> {
    const [owner] = await db.select().from(users)
      .where(and(eq(users.tenantId, tenantId), eq(users.role, 'Owner')))
      .limit(1);
    return owner;
  }

  // Method to find a user by email across all tenants (for login)
  async findUserByEmailAcrossTenants(email: string): Promise<(User & { tenant: { id: string; name: string; slug: string } }) | undefined> {
    const result = await db
      .select({
        // User fields
        id: users.id,
        tenantId: users.tenantId,
        email: users.email,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        twoFactorEnabled: users.twoFactorEnabled,
        twoFactorSecret: users.twoFactorSecret,
        emailVerified: users.emailVerified,
        emailVerificationToken: users.emailVerificationToken,
        emailVerificationExpires: users.emailVerificationExpires,
        lastVerificationEmailSent: users.lastVerificationEmailSent,
        lastLoginAt: users.lastLoginAt,
        menuExpanded: users.menuExpanded,
        stripeCustomerId: users.stripeCustomerId,
        stripeSubscriptionId: users.stripeSubscriptionId,
        subscriptionStatus: users.subscriptionStatus,
        subscriptionPlanId: users.subscriptionPlanId,
        subscriptionStartDate: users.subscriptionStartDate,
        subscriptionEndDate: users.subscriptionEndDate,
        trialEndsAt: users.trialEndsAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        // Tenant fields
        tenant: {
          id: tenants.id,
          name: tenants.name,
          slug: tenants.slug,
        },
      })
      .from(users)
      .innerJoin(tenants, eq(users.tenantId, tenants.id))
      .where(and(eq(users.email, email), eq(users.isActive, true), eq(tenants.isActive, true)))
      .limit(1);

    return result[0] as (User & { tenant: { id: string; name: string; slug: string } }) | undefined;
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
      lt(refreshTokens.expiresAt, new Date())
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
  async getUserCompany(userId: string, tenantId: string): Promise<(Company & { owner: { id: string; firstName: string | null; lastName: string | null; email: string } }) | null> {
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
      .where(and(eq(companies.ownerId, userId), eq(companies.tenantId, tenantId)))
      .limit(1);
    
    return result[0] || null;
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

  async updateUserCompany(userId: string, companyData: UpdateCompanyData, tenantId: string): Promise<Company | undefined> {
    const [company] = await db
      .update(companies)
      .set({ ...companyData, updatedAt: new Date() })
      .where(and(eq(companies.ownerId, userId), eq(companies.tenantId, tenantId)))
      .returning();
    return company;
  }

  // SaaS Limits and Validation
  async getTenantSubscription(tenantId: string): Promise<(Subscription & { plan: SubscriptionPlan }) | undefined> {
    const result = await db
      .select({
        id: subscriptions.id,
        tenantId: subscriptions.tenantId,
        userId: subscriptions.userId,
        planId: subscriptions.planId,
        stripeSubscriptionId: subscriptions.stripeSubscriptionId,
        stripeCustomerId: subscriptions.stripeCustomerId,
        status: subscriptions.status,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        trialStart: subscriptions.trialStart,
        trialEnd: subscriptions.trialEnd,
        cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
        canceledAt: subscriptions.canceledAt,
        isYearly: subscriptions.isYearly,
        createdAt: subscriptions.createdAt,
        updatedAt: subscriptions.updatedAt,
        plan: {
          id: subscriptionPlans.id,
          name: subscriptionPlans.name,
          displayName: subscriptionPlans.displayName,
          description: subscriptionPlans.description,
          price: subscriptionPlans.price,
          yearlyPrice: subscriptionPlans.yearlyPrice,
          stripePriceId: subscriptionPlans.stripePriceId,
          stripeYearlyPriceId: subscriptionPlans.stripeYearlyPriceId,
          features: subscriptionPlans.features,
          maxUsers: subscriptionPlans.maxUsers,
          maxProjects: subscriptionPlans.maxProjects,
          maxShops: subscriptionPlans.maxShops,
          storageLimit: subscriptionPlans.storageLimit,
          supportLevel: subscriptionPlans.supportLevel,
          trialDays: subscriptionPlans.trialDays,
          isPopular: subscriptionPlans.isPopular,
          isActive: subscriptionPlans.isActive,
          sortOrder: subscriptionPlans.sortOrder,
          createdAt: subscriptionPlans.createdAt,
          updatedAt: subscriptionPlans.updatedAt,
        },
      })
      .from(subscriptions)
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(and(
        eq(subscriptions.tenantId, tenantId),
        or(eq(subscriptions.status, 'active'), eq(subscriptions.status, 'trialing'))
      ))
      .limit(1);

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      ...row,
      plan: row.plan,
    } as Subscription & { plan: SubscriptionPlan };
  }

  async checkUserLimits(tenantId: string): Promise<{ canAddUser: boolean; currentUsers: number; maxUsers: number | null; planName: string }> {
    // Get current total user count for the tenant (count all users including inactive)
    const userCountResult = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.tenantId, tenantId));
    
    const currentUsers = userCountResult[0]?.count || 0;

    // Get tenant's subscription and plan limits
    const subscription = await this.getTenantSubscription(tenantId);
    
    if (!subscription) {
      // No subscription found - use basic plan limits as default
      const basicPlan = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.name, 'basic'))
        .limit(1);
      
      const maxUsers = basicPlan[0]?.maxUsers || 20; // Default to 20 if basic plan not found
      return {
        canAddUser: currentUsers < maxUsers,
        currentUsers,
        maxUsers,
        planName: basicPlan[0]?.displayName || 'Basic Plan',
      };
    }

    const maxUsers = subscription.plan.maxUsers;
    const planName = subscription.plan.displayName;

    return {
      canAddUser: maxUsers === null || currentUsers < maxUsers, // null means unlimited
      currentUsers,
      maxUsers,
      planName,
    };
  }

  async validateUserCreation(tenantId: string): Promise<void> {
    const limits = await this.checkUserLimits(tenantId);
    
    if (!limits.canAddUser) {
      if (limits.maxUsers === null) {
        // This shouldn't happen, but just in case
        throw new Error('Unable to validate user limits');
      }
      
      throw new Error(
        `User limit reached. Your ${limits.planName} allows ${limits.maxUsers} users, and you currently have ${limits.currentUsers}. Please upgrade your plan to add more users.`
      );
    }
  }

  async checkShopLimits(tenantId: string): Promise<{ canAddShop: boolean; currentShops: number; maxShops: number | null; planName: string }> {
    // Get current shop count
    const shopsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(shops)
      .where(eq(shops.tenantId, tenantId));
    
    const currentShops = shopsResult[0]?.count || 0;
    
    // Get tenant subscription
    const subscription = await this.getTenantSubscription(tenantId);
    
    if (!subscription) {
      // No subscription found - use basic plan limits as default
      const basicPlan = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.name, 'basic'))
        .limit(1);
      
      const maxShops = basicPlan[0]?.maxShops || 10; // Default to 10 if basic plan not found
      return {
        canAddShop: currentShops < maxShops,
        currentShops,
        maxShops,
        planName: basicPlan[0]?.displayName || 'Basic Plan',
      };
    }

    const maxShops = subscription.plan.maxShops;
    const planName = subscription.plan.displayName;

    return {
      canAddShop: maxShops === null || currentShops < maxShops, // null means unlimited
      currentShops,
      maxShops,
      planName,
    };
  }

  async validateShopCreation(tenantId: string): Promise<void> {
    const limits = await this.checkShopLimits(tenantId);
    
    if (!limits.canAddShop) {
      if (limits.maxShops === null) {
        // This shouldn't happen, but just in case
        throw new Error('Unable to validate shop limits');
      }
      
      throw new Error(
        `Shop limit reached. Your ${limits.planName} allows ${limits.maxShops} shops, and you currently have ${limits.currentShops}. Please upgrade your plan to add more shops.`
      );
    }
  }

  // Shop operations (tenant-aware)
  async getShop(id: string, tenantId: string): Promise<Shop | undefined> {
    const [shop] = await db.select().from(shops)
      .where(and(eq(shops.id, id), eq(shops.tenantId, tenantId)));
    return shop;
  }

  async getShopWithManager(id: string, tenantId: string): Promise<ShopWithManager | undefined> {
    const result = await db
      .select({
        id: shops.id,
        tenantId: shops.tenantId,
        name: shops.name,
        description: shops.description,
        address: shops.address,
        city: shops.city,
        state: shops.state,
        zipCode: shops.zipCode,
        country: shops.country,
        phone: shops.phone,
        email: shops.email,
        website: shops.website,
        managerId: shops.managerId,
        operatingHours: shops.operatingHours,
        status: shops.status,
        logoUrl: shops.logoUrl,
        bannerUrl: shops.bannerUrl,
        category: shops.category,
        tags: shops.tags,
        socialMedia: shops.socialMedia,
        settings: shops.settings,
        isActive: shops.isActive,
        createdAt: shops.createdAt,
        updatedAt: shops.updatedAt,
        manager: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
        },
      })
      .from(shops)
      .leftJoin(users, eq(shops.managerId, users.id))
      .where(and(eq(shops.id, id), eq(shops.tenantId, tenantId)))
      .limit(1);
    
    if (result.length === 0) return undefined;
    
    const row = result[0];
    return {
      ...row,
      manager: row.manager?.id ? row.manager as User : undefined,
    } as ShopWithManager;
  }

  async getAllShops(tenantId: string, filters?: ShopFilters): Promise<ShopWithManager[]> {
    const conditions = [eq(shops.tenantId, tenantId)];
    
    if (filters?.status && filters.status !== 'all') {
      conditions.push(eq(shops.status, filters.status));
    }
    
    if (filters?.category) {
      conditions.push(eq(shops.category, filters.category));
    }
    
    if (filters?.managerId) {
      conditions.push(eq(shops.managerId, filters.managerId));
    }
    
    if (filters?.search) {
      conditions.push(
        or(
          ilike(shops.name, `%${filters.search}%`),
          ilike(shops.city, `%${filters.search}%`),
          ilike(shops.email, `%${filters.search}%`),
          ilike(shops.phone, `%${filters.search}%`)
        ) || sql`true`
      );
    }
    
    const result = await db
      .select({
        id: shops.id,
        tenantId: shops.tenantId,
        name: shops.name,
        description: shops.description,
        address: shops.address,
        city: shops.city,
        state: shops.state,
        zipCode: shops.zipCode,
        country: shops.country,
        phone: shops.phone,
        email: shops.email,
        website: shops.website,
        managerId: shops.managerId,
        operatingHours: shops.operatingHours,
        status: shops.status,
        logoUrl: shops.logoUrl,
        bannerUrl: shops.bannerUrl,
        category: shops.category,
        tags: shops.tags,
        socialMedia: shops.socialMedia,
        settings: shops.settings,
        isActive: shops.isActive,
        createdAt: shops.createdAt,
        updatedAt: shops.updatedAt,
        manager: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
        },
      })
      .from(shops)
      .leftJoin(users, eq(shops.managerId, users.id))
      .where(and(...conditions))
      .orderBy(desc(shops.createdAt));
    
    return result.map(row => ({
      ...row,
      manager: row.manager?.id ? row.manager as User : undefined,
    })) as ShopWithManager[];
  }

  async getShopsByManager(managerId: string, tenantId: string): Promise<Shop[]> {
    return db.select().from(shops)
      .where(and(eq(shops.managerId, managerId), eq(shops.tenantId, tenantId)));
  }

  async createShop(shopData: CreateShopData, tenantId: string): Promise<Shop> {
    // Validate shop limits before creating
    await this.validateShopCreation(tenantId);
    
    const [shop] = await db
      .insert(shops)
      .values({
        ...shopData,
        tenantId,
        updatedAt: new Date(),
      })
      .returning();
    return shop;
  }

  async updateShop(id: string, updates: UpdateShopData, tenantId: string): Promise<Shop | undefined> {
    const [shop] = await db
      .update(shops)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(shops.id, id), eq(shops.tenantId, tenantId)))
      .returning();
    return shop;
  }

  async deleteShop(id: string, tenantId: string): Promise<void> {
    await db.delete(shops).where(and(eq(shops.id, id), eq(shops.tenantId, tenantId)));
  }

  async toggleShopStatus(id: string, isActive: boolean, tenantId: string): Promise<Shop | undefined> {
    const [shop] = await db
      .update(shops)
      .set({ 
        isActive, 
        status: isActive ? 'active' : 'inactive',
        updatedAt: new Date() 
      })
      .where(and(eq(shops.id, id), eq(shops.tenantId, tenantId)))
      .returning();
    return shop;
  }

  async getShopStats(tenantId: string): Promise<{ totalShops: number; activeShops: number; shopsByCategory: Record<string, number> }> {
    const [totalResult] = await db
      .select({ count: count() })
      .from(shops)
      .where(eq(shops.tenantId, tenantId));
    
    const [activeResult] = await db
      .select({ count: count() })
      .from(shops)
      .where(and(eq(shops.tenantId, tenantId), eq(shops.isActive, true)));
    
    const categoryResult = await db
      .select({
        category: shops.category,
        count: count(),
      })
      .from(shops)
      .where(eq(shops.tenantId, tenantId))
      .groupBy(shops.category);
    
    const shopsByCategory: Record<string, number> = {};
    categoryResult.forEach(row => {
      if (row.category) {
        shopsByCategory[row.category] = row.count;
      }
    });
    
    return {
      totalShops: totalResult.count,
      activeShops: activeResult.count,
      shopsByCategory,
    };
  }

}

export const storage = new DatabaseStorage();
