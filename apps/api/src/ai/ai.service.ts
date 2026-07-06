import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiNotConfiguredError,
  composeSystemPrompt,
  createLanguageModel,
  defineTool,
  isAiConfigured,
} from '@repo/ai';
import { aiConversations, aiMessages, eq, type Database } from '@repo/db';
import { convertToModelMessages, streamText, type UIMessage } from 'ai';
import type { Response } from 'express';
import { z } from 'zod';
import { AppException } from '../common/errors/app.exception.js';
import { DATABASE_TOKEN } from '../database/database.module.js';
import { ProjectsService } from '../projects/projects.service.js';

type ChatRequest = {
  conversationId?: string;
  messages: UIMessage[];
};

type ProjectToolRow = {
  id: string;
  name: string;
  status: string;
};

type UiStreamResult = {
  pipeUIMessageStreamToResponse(response: Response): void;
};

@Injectable()
export class AiService {
  constructor(
    private readonly config: ConfigService,
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly projectsService: ProjectsService,
  ) {}

  isEnabled() {
    return isAiConfigured(this.aiConfig());
  }

  async streamChat(
    userId: string,
    organizationId: string | null,
    body: ChatRequest,
  ): Promise<UiStreamResult> {
    const model = this.languageModel();
    const conversationId =
      body.conversationId ??
      (await this.createConversation(userId, organizationId));
    await this.persistNewUserMessage(conversationId, body.messages);

    return streamText({
      model,
      system: composeSystemPrompt([
        'You are the product assistant embedded in this starter template.',
        'Be concise, operational, and careful with permissions.',
        'Use tools when the user asks about their project records.',
      ]),
      messages: await convertToModelMessages(body.messages),
      tools: {
        listProjects: defineTool({
          description: 'List the current user project names and statuses.',
          inputSchema: z.object({}),
          execute: async () => {
            const result = await this.projectsService.list(userId, {
              limit: 10,
            });
            return (result.rows as ProjectToolRow[]).map((project) => ({
              id: project.id,
              name: project.name,
              status: project.status,
            }));
          },
        }),
      },
      onFinish: async ({ text }) => {
        await this.persistAssistantMessage(conversationId, text);
      },
    });
  }

  private aiConfig() {
    return {
      provider: this.config.get<'anthropic' | 'openai' | 'google'>(
        'AI_PROVIDER',
      ),
      model: this.config.get<string>('AI_MODEL'),
      anthropicApiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
      openaiApiKey: this.config.get<string>('OPENAI_API_KEY'),
      googleApiKey: this.config.get<string>('GOOGLE_GENERATIVE_AI_API_KEY'),
    };
  }

  private languageModel() {
    try {
      return createLanguageModel(this.aiConfig());
    } catch (error) {
      if (error instanceof AiNotConfiguredError) {
        throw new AppException('AI_NOT_CONFIGURED');
      }
      throw error;
    }
  }

  private async createConversation(
    userId: string,
    organizationId: string | null,
  ) {
    const id = randomUUID();
    await this.db.insert(aiConversations).values({
      id,
      userId,
      organizationId,
    });
    return id;
  }

  private async persistNewUserMessage(
    conversationId: string,
    messages: UIMessage[],
  ) {
    const last = [...messages]
      .reverse()
      .find((message) => message.role === 'user');
    if (!last) return;
    await this.db.insert(aiMessages).values({
      id: randomUUID(),
      conversationId,
      role: 'user',
      parts: last.parts,
    });
    await this.db
      .update(aiConversations)
      .set({ updatedAt: new Date() })
      .where(eq(aiConversations.id, conversationId));
  }

  private async persistAssistantMessage(conversationId: string, text: string) {
    if (!text.trim()) return;
    await this.db.insert(aiMessages).values({
      id: randomUUID(),
      conversationId,
      role: 'assistant',
      parts: [{ type: 'text', text }],
    });
    await this.db
      .update(aiConversations)
      .set({ updatedAt: new Date() })
      .where(eq(aiConversations.id, conversationId));
  }
}
