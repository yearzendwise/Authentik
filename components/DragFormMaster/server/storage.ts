import { users, forms, type User, type InsertUser, type Form, type InsertForm } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getForm(id: number): Promise<Form | undefined>;
  getForms(): Promise<Form[]>;
  createForm(form: InsertForm): Promise<Form>;
  updateForm(id: number, form: Partial<InsertForm>): Promise<Form | undefined>;
  deleteForm(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private forms: Map<number, Form>;
  private currentUserId: number;
  private currentFormId: number;

  constructor() {
    this.users = new Map();
    this.forms = new Map();
    this.currentUserId = 1;
    this.currentFormId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getForm(id: number): Promise<Form | undefined> {
    return this.forms.get(id);
  }

  async getForms(): Promise<Form[]> {
    return Array.from(this.forms.values());
  }

  async createForm(insertForm: InsertForm): Promise<Form> {
    const id = this.currentFormId++;
    const form: Form = { 
      ...insertForm, 
      id,
      description: insertForm.description || null,
      settings: insertForm.settings ? {
        actionUrl: insertForm.settings.actionUrl,
        method: insertForm.settings.method as 'GET' | 'POST',
        enctype: insertForm.settings.enctype
      } : null
    };
    this.forms.set(id, form);
    return form;
  }

  async updateForm(id: number, updateData: Partial<InsertForm>): Promise<Form | undefined> {
    const existingForm = this.forms.get(id);
    if (!existingForm) return undefined;
    
    const updatedForm: Form = {
      ...existingForm,
      ...updateData,
      description: updateData.description !== undefined ? updateData.description : existingForm.description,
      settings: updateData.settings ? {
        actionUrl: updateData.settings.actionUrl,
        method: updateData.settings.method as 'GET' | 'POST',
        enctype: updateData.settings.enctype
      } : existingForm.settings,
      updatedAt: new Date().toISOString(),
    };
    this.forms.set(id, updatedForm);
    return updatedForm;
  }

  async deleteForm(id: number): Promise<boolean> {
    return this.forms.delete(id);
  }
}

export const storage = new MemStorage();
