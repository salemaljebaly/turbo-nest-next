import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';
import { DrizzleHealthIndicator } from './drizzle.health.js';
import { RedisHealthIndicator } from './redis.health.js';
import { StorageHealthIndicator } from './storage.health.js';
import { WorkerHealthIndicator } from './worker.health.js';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    DrizzleHealthIndicator,
    RedisHealthIndicator,
    StorageHealthIndicator,
    WorkerHealthIndicator,
  ],
})
export class HealthModule {}
