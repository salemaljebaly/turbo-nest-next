import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const redisUrl = process.env['REDIS_URL'];

    if (!redisUrl) {
      // Redis is optional — report as healthy but note it is not configured
      return this.getStatus(key, true, { message: 'not configured' });
    }

    let redis: Redis | null = null;
    try {
      redis = new Redis(redisUrl, { connectTimeout: 3_000, maxRetriesPerRequest: 1 });
      await redis.ping();
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false, { message: String(error) }),
      );
    } finally {
      await redis?.quit().catch(() => undefined);
    }
  }
}
