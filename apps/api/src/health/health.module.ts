import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';
import { DrizzleHealthIndicator } from './drizzle.health.js';
import { RedisHealthIndicator } from './redis.health.js';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [DrizzleHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
