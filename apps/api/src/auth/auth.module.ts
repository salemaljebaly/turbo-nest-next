import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Database } from '@repo/db';
import { DATABASE_TOKEN } from '../database/database.module.js';
import { AUTH_TOKEN, createAuth } from './auth.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { createEmailSender } from './email.js';

@Module({
  controllers: [AuthController],
  providers: [
    AuthGuard,
    {
      provide: AUTH_TOKEN,
      inject: [ConfigService, DATABASE_TOKEN],
      useFactory: (config: ConfigService, db: Database) => {
        const corsOrigins =
          config
            .get<string>('CORS_ORIGINS', 'http://localhost:3000')
            .split(',')
            .map((origin) => origin.trim())
            .filter(Boolean);

        const sendEmail = createEmailSender({
          appName: config.get<string>('APP_NAME', 'MyApp'),
          nodeEnv: config.get<string>('NODE_ENV', 'development'),
          smtpHost: config.get<string>('SMTP_HOST'),
          smtpPort: config.get<number>('SMTP_PORT'),
          smtpSecure: config.get<string>('SMTP_SECURE') === 'true',
          smtpUser: config.get<string>('SMTP_USER'),
          smtpPass: config.get<string>('SMTP_PASS'),
          smtpFrom: config.get<string>('SMTP_FROM'),
        });

        return createAuth({
          db,
          appName: config.get<string>('APP_NAME', 'MyApp'),
          appUrl: config.get<string>('APP_URL', 'http://localhost:3000'),
          corsOrigins,
          redisUrl: config.get<string>('REDIS_URL'),
          nodeEnv: config.get<string>('NODE_ENV', 'development'),
          sendEmail,
        });
      },
    },
  ],
  exports: [AUTH_TOKEN, AuthGuard],
})
export class AuthModule {}
