import { Controller, Get, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('observability')
@Controller({ path: 'observability', version: '1' })
export class SentrySmokeController {
  private readonly logger = new Logger(SentrySmokeController.name);

  constructor(private readonly config: ConfigService) {}

  @Get('sentry-smoke')
  @ApiOperation({
    summary: 'Manually trigger a Sentry smoke-test error when enabled',
  })
  triggerSentrySmoke() {
    if (!this.config.get<boolean>('SENTRY_SMOKE_TEST_ENABLED', false)) {
      throw new NotFoundException('Sentry smoke test is disabled');
    }

    this.logger.error(
      JSON.stringify({
        event: 'sentry_smoke_test',
        message: 'Manual Sentry smoke test requested',
      }),
    );

    throw new Error('Sentry smoke test error');
  }
}
