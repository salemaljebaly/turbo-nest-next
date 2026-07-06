import {
  Global,
  Injectable,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_TOKEN = Symbol('REDIS');

@Injectable()
class RedisProvider implements OnApplicationShutdown {
  readonly client: Redis | null;

  constructor(config: ConfigService) {
    const redisUrl = config.get<string>('REDIS_URL');
    this.client = redisUrl
      ? new Redis(redisUrl, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableReadyCheck: false,
        })
      : null;
  }

  async onApplicationShutdown() {
    await this.client?.quit().catch(() => undefined);
  }
}

@Global()
@Module({
  providers: [
    RedisProvider,
    {
      provide: REDIS_TOKEN,
      inject: [RedisProvider],
      useFactory: (provider: RedisProvider): Redis | null => provider.client,
    },
  ],
  exports: [REDIS_TOKEN],
})
export class RedisModule {}
