import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type UIMessage } from 'ai';
import type { Response } from 'express';
import { AuthGuard, type SessionRequest } from '../auth/auth.guard.js';
import { SkipApiEnvelope } from '../common/decorators/api-envelope.decorator.js';
import { AiService } from './ai.service.js';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({ path: 'ai', version: '1' })
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get('status')
  @ApiOperation({ summary: 'Check whether AI is configured' })
  status() {
    return { enabled: this.ai.isEnabled() };
  }

  @Post('chat')
  @SkipApiEnvelope()
  @ApiOperation({ summary: 'Stream an authenticated AI chat response' })
  async chat(
    @Req() request: SessionRequest,
    @Body() body: { conversationId?: string; messages: UIMessage[] },
    @Res() response: Response,
  ) {
    const result = await this.ai.streamChat(
      request.session.user.id,
      request.session.session.activeOrganizationId ?? null,
      body,
    );

    result.pipeUIMessageStreamToResponse(response);
  }
}
