import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDb, type Database } from '@repo/db';

export const DATABASE_TOKEN = Symbol('DATABASE');

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_TOKEN,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Database => {
        return createDb(config.getOrThrow<string>('DATABASE_URL'));
      },
    },
  ],
  exports: [DATABASE_TOKEN],
})
export class DatabaseModule {}
