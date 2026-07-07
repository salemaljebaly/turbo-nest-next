# AI Package

The template includes an optional AI layer powered by the Vercel AI SDK.

## Packages

- `packages/ai`: framework-free provider factory and helpers for
  `streamText`, `generateText`, `generateObject`, tool definitions, and system
  prompt composition.
- `apps/api/src/ai`: authenticated NestJS streaming endpoint and persistence.
- `apps/web/components/chat-widget.tsx`: dashboard chat widget using
  `useChat` from `@ai-sdk/react`.

## Configuration

Set the provider and model in `.env`:

```bash
AI_PROVIDER=anthropic
AI_MODEL=claude-sonnet-5
ANTHROPIC_API_KEY=...
```

Supported provider values are `anthropic`, `openai`, and `google`.

Provider keys:

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`

If the selected provider key is missing, `GET /api/v1/ai/status` returns
`{ enabled: false }`, the dashboard widget hides, and `POST /api/v1/ai/chat`
returns the standard envelope code `AI_NOT_CONFIGURED`.

## Persistence

Conversations and messages are stored in:

- `ai_conversations`
- `ai_messages`

Rows are scoped by `userId` and optionally `organizationId`.

`POST /api/v1/ai/chat` returns the active conversation id in the
`x-conversation-id` response header. Clients should send that id as
`conversationId` on later chat requests to append to the same conversation. The
API verifies the conversation belongs to the authenticated user before storing
or streaming new messages.

## Tools

The example `listProjects` tool calls `ProjectsService.list()` for the current
user. Add tools in API modules so authorization, tenancy, and business rules
stay behind service boundaries.
