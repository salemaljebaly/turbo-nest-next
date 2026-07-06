import { Inject, Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  type HealthIndicatorResult,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { workerHeartbeatKey } from '@repo/jobs';
import Redis from 'ioredis';
import { REDIS_TOKEN } from '../common/redis/redis.module.js';

@Injectable()
export class WorkerHealthIndicator extends HealthIndicator {
  constructor(
    @Inject(REDIS_TOKEN) private readonly redis: Redis | null,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const required = this.config.get<boolean>('WORKER_HEALTH_REQUIRED', true);
    const heartbeat = await this.redis?.get(
      workerHeartbeatKey(this.config.get<string>('QUEUE_PREFIX', 'template')),
    );
    if (!heartbeat) {
      if (!required) {
        return this.getStatus(key, true, {
          heartbeat: null,
          required: false,
        });
      }
      throw new HealthCheckError(
        'Worker heartbeat is missing',
        this.getStatus(key, false, { heartbeat: null }),
      );
    }
    const ageSeconds = Math.max(
      0,
      Math.floor((Date.now() - new Date(heartbeat).getTime()) / 1000),
    );
    if (!Number.isFinite(ageSeconds) || ageSeconds > 45) {
      if (!required) {
        return this.getStatus(key, true, {
          heartbeat,
          ageSeconds,
          required: false,
        });
      }
      throw new HealthCheckError(
        'Worker heartbeat is stale',
        this.getStatus(key, false, { heartbeat, ageSeconds }),
      );
    }
    return this.getStatus(key, true, { heartbeat, ageSeconds });
  }
}
