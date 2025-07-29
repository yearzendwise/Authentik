// AI Agent Types and Interfaces

export interface AgentContext {
  tenantId: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: any, context: AgentContext) => Promise<any>;
}

export interface AgentConfig {
  name: string;
  description: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  tools?: AgentTool[];
  capabilities?: string[];
}

export interface AgentResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AgentTask {
  id: string;
  agentName: string;
  objective: string;
  context: AgentContext;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: AgentResult;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  
  constructor(config: AgentConfig) {
    this.config = config;
  }

  abstract execute(objective: string, context: AgentContext): Promise<AgentResult>;
  
  getName(): string {
    return this.config.name;
  }
  
  getDescription(): string {
    return this.config.description;
  }
  
  getTools(): AgentTool[] {
    return this.config.tools || [];
  }
}