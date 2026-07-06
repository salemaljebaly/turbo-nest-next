import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipApiEnvelope } from '../common/decorators/api-envelope.decorator.js';
import { DrizzleHealthIndicator } from './drizzle.health.js';
import { RedisHealthIndicator } from './redis.health.js';
import { StorageHealthIndicator } from './storage.health.js';
import { WorkerHealthIndicator } from './worker.health.js';

@ApiTags('health')
@SkipApiEnvelope()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly drizzle: DrizzleHealthIndicator,
    private readonly redis: RedisHealthIndicator,
    private readonly storage: StorageHealthIndicator,
    private readonly worker: WorkerHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary:
      'Infrastructure health check (database + cache + storage + worker)',
  })
  check() {
    return this.health.check([
      () => this.drizzle.isHealthy('database'),
      () => this.redis.isHealthy('redis'),
      () => this.storage.isHealthy('storage'),
      () => this.worker.isHealthy('worker'),
    ]);
  }
}
