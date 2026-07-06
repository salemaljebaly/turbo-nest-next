import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheckError,
  HealthIndicator,
  type HealthIndicatorResult,
} from '@nestjs/terminus';

@Injectable()
export class StorageHealthIndicator extends HealthIndicator {
  constructor(private readonly config: ConfigService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const endpoint = this.config.get<string>('STORAGE_ENDPOINT');
    if (!endpoint) {
      return this.getStatus(key, true, { message: 'not configured' });
    }

    try {
      const response = await fetch(endpoint, { method: 'HEAD' });
      if (response.ok || response.status === 403 || response.status === 404) {
        return this.getStatus(key, true, { endpoint });
      }
      throw new Error(`unexpected status ${response.status}`);
    } catch (error) {
      throw new HealthCheckError(
        'Object storage check failed',
        this.getStatus(key, false, { message: String(error) }),
      );
    }
  }
}
