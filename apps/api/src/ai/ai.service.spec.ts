import { ConfigService } from '@nestjs/config';
import { convertToModelMessages, streamText } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiService } from './ai.service.js';

vi.mock('@repo/ai', () => {
  class AiNotConfiguredError extends Error {}
  return {
    AiNotConfiguredError,
    composeSystemPrompt: vi.fn((parts: string[]) => parts.join('\n')),
    createLanguageModel: vi.fn(() => ({ provider: 'test' })),
    defineTool: vi.fn((tool: unknown) => tool),
    isAiConfigured: vi.fn(() => true),
  };
});

vi.mock('ai', () => ({
  convertToModelMessages: vi.fn(async (messages: unknown) => messages),
  streamText: vi.fn(() => ({
    pipeUIMessageStreamToResponse: vi.fn(),
  })),
}));

const messages = [
  {
    id: 'message-1',
    role: 'user',
    parts: [{ type: 'text', text: 'List my projects' }],
  },
] as never;

function createDb(selected: unknown[] = []) {
  const insertValues = vi.fn().mockResolvedValue(undefined);
  const insert = vi.fn(() => ({ values: insertValues }));

  const updateWhere = vi.fn().mockResolvedValue(undefined);
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const update = vi.fn(() => ({ set: updateSet }));

  const selectWhere = vi.fn().mockResolvedValue(selected);
  const select = vi.fn(() => ({
    from: () => ({
      where: selectWhere,
    }),
  }));

  return {
    db: { insert, select, update },
    insert,
    insertValues,
    selectWhere,
  };
}

function createService(db: unknown) {
  return new AiService(
    { get: vi.fn(() => 'configured') } as unknown as ConfigService,
    db as never,
    { list: vi.fn() } as never,
  );
}

describe(AiService.name, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a conversation and returns its id for new chat requests', async () => {
    const { db, insertValues } = createDb();
    const service = createService(db);

    const result = await service.streamChat('user-1', 'org-1', { messages });

    expect(result.conversationId).toEqual(expect.any(String));
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        id: result.conversationId,
        userId: 'user-1',
        organizationId: 'org-1',
      }),
    );
    expect(streamText).toHaveBeenCalledOnce();
    expect(convertToModelMessages).toHaveBeenCalledWith(messages);
  });

  it('uses an existing conversation only when it belongs to the user', async () => {
    const { db, insert } = createDb([{ id: 'conversation-1' }]);
    const service = createService(db);

    const result = await service.streamChat('user-1', null, {
      conversationId: 'conversation-1',
      messages,
    });

    expect(result.conversationId).toBe('conversation-1');
    expect(insert).toHaveBeenCalledTimes(1);
    expect(streamText).toHaveBeenCalledOnce();
  });

  it('rejects a conversation id that does not belong to the user', async () => {
    const { db } = createDb([]);
    const service = createService(db);

    await expect(
      service.streamChat('user-1', null, {
        conversationId: 'conversation-1',
        messages,
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'NOT_FOUND' }),
      status: 404,
    });
    expect(streamText).not.toHaveBeenCalled();
  });
});
