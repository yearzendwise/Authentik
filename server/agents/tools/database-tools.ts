import { AgentTool, AgentContext } from '../types';
import { db } from '../../db';
import { shops, users, forms, formResponses } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export const getShopInfoTool: AgentTool = {
  name: 'get_shop_info',
  description: 'Get information about shops in the system',
  parameters: {
    type: 'object',
    properties: {
      shopId: {
        type: 'string',
        description: 'Optional shop ID to get specific shop info',
      },
      status: {
        type: 'string',
        enum: ['active', 'inactive', 'maintenance'],
        description: 'Filter by shop status',
      },
    },
  },
  execute: async (args, context) => {
    const conditions = [eq(shops.tenantId, context.tenantId)];
    
    if (args.shopId) {
      conditions.push(eq(shops.id, args.shopId));
    }
    
    if (args.status) {
      conditions.push(eq(shops.status, args.status));
    }
    
    const results = await db
      .select()
      .from(shops)
      .where(and(...conditions))
      .limit(10);
    
    return results;
  },
};

export const getUserStatsTool: AgentTool = {
  name: 'get_user_stats',
  description: 'Get statistics about users in the system',
  parameters: {
    type: 'object',
    properties: {
      includeInactive: {
        type: 'boolean',
        description: 'Include inactive users in stats',
      },
    },
  },
  execute: async (args, context) => {
    const conditions = [eq(users.tenantId, context.tenantId)];
    
    if (!args.includeInactive) {
      conditions.push(eq(users.isActive, true));
    }
    
    const [stats] = await db
      .select({
        totalUsers: sql<number>`count(*)::int`,
        activeUsers: sql<number>`count(*) filter (where ${users.isActive} = true)::int`,
        byRole: sql<Record<string, number>>`
          json_object_agg(
            ${users.role}, 
            count(*)
          ) filter (where ${users.role} is not null)
        `,
      })
      .from(users)
      .where(and(...conditions));
    
    return stats;
  },
};

export const getFormResponsesTool: AgentTool = {
  name: 'get_form_responses',
  description: 'Get recent form responses',
  parameters: {
    type: 'object',
    properties: {
      formId: {
        type: 'string',
        description: 'Optional form ID to filter responses',
      },
      limit: {
        type: 'number',
        description: 'Number of responses to return (default 10)',
      },
    },
  },
  execute: async (args, context) => {
    const conditions = [eq(formResponses.tenantId, context.tenantId)];
    
    if (args.formId) {
      conditions.push(eq(formResponses.formId, args.formId));
    }
    
    const results = await db
      .select({
        id: formResponses.id,
        formId: formResponses.formId,
        responseData: formResponses.responseData,
        submittedAt: formResponses.submittedAt,
        formTitle: forms.title,
      })
      .from(formResponses)
      .innerJoin(forms, eq(formResponses.formId, forms.id))
      .where(and(...conditions))
      .orderBy(desc(formResponses.submittedAt))
      .limit(args.limit || 10);
    
    return results.map(r => ({
      ...r,
      responseData: JSON.parse(r.responseData),
    }));
  },
};

export const createNoteTool: AgentTool = {
  name: 'create_note',
  description: 'Create a note or summary about something',
  parameters: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Title of the note',
      },
      content: {
        type: 'string',
        description: 'Content of the note',
      },
      category: {
        type: 'string',
        description: 'Category or type of note',
      },
    },
    required: ['title', 'content'],
  },
  execute: async (args, context) => {
    // This would typically save to a notes table
    // For now, we'll return the formatted note
    return {
      id: `note_${Date.now()}`,
      title: args.title,
      content: args.content,
      category: args.category || 'general',
      createdAt: new Date(),
      context,
    };
  },
};