import { pgTable, text, serial, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const forms = pgTable("forms", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  elements: json("elements").notNull().$type<FormElement[]>(),
  settings: json("settings").$type<FormSettings>(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFormSchema = createInsertSchema(forms).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertForm = z.infer<typeof insertFormSchema>;
export type Form = typeof forms.$inferSelect;

// Form Builder Types
export interface FormElement {
  id: string;
  type: FormElementType;
  label: string;
  labelTranslations?: Record<string, string>; // language code -> translated label
  placeholder?: string;
  helpText?: string;
  name: string;
  required: boolean;
  validation?: ValidationRules;
  styling?: ElementStyling;
  options?: string[]; // for select, radio, checkbox
  disabled?: boolean;
  readonly?: boolean;
  rateVariant?: 'numbers' | 'faces' | 'stars'; // for rate-scale components
  booleanVariant?: 'yes-no' | 'true-false' | 'on-off'; // for boolean-switch components
  dateTimeVariant?: 'date-only' | 'time-only' | 'datetime'; // for datetime-picker components
  numberVariant?: 'number' | 'phone' | 'currency'; // for number-input components
}

export interface ValidationRules {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
}

export interface ElementStyling {
  width: 'full' | 'half' | 'third';
  size: 'small' | 'medium' | 'large';
}

export interface FormSettings {
  actionUrl: string;
  method: 'GET' | 'POST';
  enctype?: string;
}

export type FormElementType = 
  | 'text-input' 
  | 'email-input' 
  | 'number-input' 
  | 'textarea' 
  | 'select' 
  | 'checkbox' 
  | 'radio' 
  | 'image'
  | 'rate-scale'
  | 'boolean-switch'
  | 'datetime-picker'
  | 'full-name';
