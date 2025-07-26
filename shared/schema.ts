import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, decimal, integer, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const userRoles = ['Employee', 'Manager', 'Administrator'] as const;
export type UserRole = typeof userRoles[number];

// Tenants table for multi-tenancy
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // URL-friendly identifier
  domain: text("domain"), // Custom domain (optional)
  isActive: boolean("is_active").default(true),
  settings: text("settings").default('{}'), // JSON settings
  maxUsers: integer("max_users").default(10), // User limit per tenant
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").default('Employee').notNull(), // User role for permissions
  isActive: boolean("is_active").default(true),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  lastVerificationEmailSent: timestamp("last_verification_email_sent"),
  lastLoginAt: timestamp("last_login_at"), // Track last login for user management
  menuExpanded: boolean("menu_expanded").default(false), // New field for menu preference
  // Stripe fields for subscription management
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default('inactive'), // active, inactive, canceled, past_due
  subscriptionPlanId: varchar("subscription_plan_id"),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  // Device tracking fields
  deviceId: text("device_id").default(sql`gen_random_uuid()`).notNull(), // Unique identifier for the device/session
  deviceName: text("device_name"), // User-friendly device name
  userAgent: text("user_agent"), // Browser/app user agent
  ipAddress: text("ip_address"), // IP address at login
  location: text("location"), // Approximate location (optional)
  lastUsed: timestamp("last_used").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Subscription plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Basic, Pro, Enterprise
  displayName: text("display_name").notNull(), // User-friendly name
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Monthly price
  yearlyPrice: decimal("yearly_price", { precision: 10, scale: 2 }), // Yearly price (optional discount)
  stripePriceId: text("stripe_price_id").notNull(), // Stripe Price ID for monthly
  stripeYearlyPriceId: text("stripe_yearly_price_id"), // Stripe Price ID for yearly
  features: text("features").array().notNull(), // Array of feature descriptions
  maxUsers: integer("max_users"), // null = unlimited
  maxProjects: integer("max_projects"), // null = unlimited
  storageLimit: integer("storage_limit"), // in GB, null = unlimited
  supportLevel: text("support_level").default('email'), // email, priority, dedicated
  trialDays: integer("trial_days").default(14),
  isPopular: boolean("is_popular").default(false),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User subscriptions history table
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  status: text("status").notNull(), // active, canceled, incomplete, past_due, trialing, etc.
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  canceledAt: timestamp("canceled_at"),
  isYearly: boolean("is_yearly").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email verification tokens table (missing from current schema)
export const verificationTokens = pgTable("verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Forms table for DragFormMaster integration with multi-tenancy
export const forms = pgTable("forms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  description: text("description"),
  formData: text("form_data").notNull(), // JSON string of form structure
  theme: text("theme").default('modern'),
  isActive: boolean("is_active").default(true),
  responseCount: integer("response_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Form responses table for storing form submissions
export const formResponses = pgTable("form_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  formId: varchar("form_id").notNull().references(() => forms.id, { onDelete: 'cascade' }),
  responseData: text("response_data").notNull(), // JSON string of form responses
  submittedAt: timestamp("submitted_at").defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// Relations
export const tenantRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  forms: many(forms),
  refreshTokens: many(refreshTokens),
  verificationTokens: many(verificationTokens),
  formResponses: many(formResponses),
}));

export const userRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  refreshTokens: many(refreshTokens),
  forms: many(forms),
  verificationTokens: many(verificationTokens),
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
}));

export const formRelations = relations(forms, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [forms.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [forms.userId],
    references: [users.id],
  }),
  responses: many(formResponses),
}));

export const formResponseRelations = relations(formResponses, ({ one }) => ({
  tenant: one(tenants, {
    fields: [formResponses.tenantId],
    references: [tenants.id],
  }),
  form: one(forms, {
    fields: [formResponses.formId],
    references: [forms.id],
  }),
}));

export const refreshTokenRelations = relations(refreshTokens, ({ one }) => ({
  tenant: one(tenants, {
    fields: [refreshTokens.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const verificationTokenRelations = relations(verificationTokens, ({ one }) => ({
  tenant: one(tenants, {
    fields: [verificationTokens.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [verificationTokens.userId],
    references: [users.id],
  }),
}));

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id],
  }),
}));

export const subscriptionPlanRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  twoFactorToken: z.string().optional(),
  tenantSlug: z.string().optional(),
});

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  confirmPassword: z.string(),
  selectedPlan: z.string().optional(), // Plan ID for subscription
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
  tenantName: z.string().min(1, "Organization name is required"),
  tenantSlug: z.string().min(1, "Organization identifier is required").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export const resendVerificationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const enable2FASchema = z.object({
  token: z.string().min(6, "Please enter a 6-digit code").max(6, "Please enter a 6-digit code"),
});

export const disable2FASchema = z.object({
  token: z.string().min(6, "Please enter a 6-digit code").max(6, "Please enter a 6-digit code"),
});

export const verify2FASchema = z.object({
  token: z.string().min(6, "Please enter a 6-digit code").max(6, "Please enter a 6-digit code"),
});

// Device session management schemas
export const createDeviceSessionSchema = z.object({
  deviceName: z.string().optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  location: z.string().optional(),
});

// User management schemas
export const createUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(userRoles).default('Employee'),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(userRoles),
  isActive: z.boolean(),
});

export const userFiltersSchema = z.object({
  search: z.string().optional(),
  role: z.enum(userRoles).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  showInactive: z.preprocess((val) => {
    if (typeof val === 'string') {
      return val === 'true';
    }
    return val;
  }, z.boolean()).default(false),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type Enable2FAData = z.infer<typeof enable2FASchema>;
export type Disable2FAData = z.infer<typeof disable2FASchema>;
export type Verify2FAData = z.infer<typeof verify2FASchema>;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type DeviceSession = typeof refreshTokens.$inferSelect;
export type CreateDeviceSessionData = z.infer<typeof createDeviceSessionSchema>;
export type VerifyEmailData = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationData = z.infer<typeof resendVerificationSchema>;

// User management types
export type CreateUserData = z.infer<typeof createUserSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
export type UserFilters = z.infer<typeof userFiltersSchema>;

// Subscription types
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// API Response types
export interface UserSubscriptionResponse {
  subscription: (Subscription & { plan: SubscriptionPlan }) | null;
}

// Subscription schemas
export const subscriptionPlanSchema = createInsertSchema(subscriptionPlans);
export const createSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Billing schemas
export const billingInfoSchema = z.object({
  planId: z.string(),
  billingCycle: z.enum(['monthly', 'yearly']),
  paymentMethodId: z.string().optional(),
});

export type BillingInfo = z.infer<typeof billingInfoSchema>;

// Multi-tenancy schemas and types
export const tenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const createTenantSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  slug: z.string().min(1, "Organization identifier is required").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
  domain: z.string().optional(),
  maxUsers: z.number().default(10),
});

export const updateTenantSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  domain: z.string().optional(),
  isActive: z.boolean(),
  maxUsers: z.number().min(1),
});

// Form schemas
export const createFormSchema = z.object({
  title: z.string().min(1, "Form title is required"),
  description: z.string().optional(),
  formData: z.string().min(1, "Form structure is required"),
  theme: z.string().default('modern'),
});

export const updateFormSchema = z.object({
  title: z.string().min(1, "Form title is required"),
  description: z.string().optional(),
  formData: z.string().min(1, "Form structure is required"),
  theme: z.string(),
  isActive: z.boolean(),
});

export const submitFormResponseSchema = z.object({
  formId: z.string(),
  responseData: z.string(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

// Multi-tenancy types
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof tenantSchema>;
export type CreateTenantData = z.infer<typeof createTenantSchema>;
export type UpdateTenantData = z.infer<typeof updateTenantSchema>;

// Form types
export type Form = typeof forms.$inferSelect;
export type InsertForm = typeof forms.$inferInsert;
export type CreateFormData = z.infer<typeof createFormSchema>;
export type UpdateFormData = z.infer<typeof updateFormSchema>;
export type FormResponse = typeof formResponses.$inferSelect;
export type InsertFormResponse = typeof formResponses.$inferInsert;
export type SubmitFormResponseData = z.infer<typeof submitFormResponseSchema>;

// Extended types for tenant-aware operations
export interface UserWithTenant extends User {
  tenant: Tenant;
}

export interface FormWithDetails extends Form {
  user: User;
  tenant: Tenant;
  responseCount: number;
}
