import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { resolve } from 'node:path';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AiModule } from './ai/ai.module.js';
import { AdminAuditInterceptor } from './audit/admin-audit.interceptor.js';
import { AuditModule } from './audit/audit.module.js';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor.js';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor.js';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor.js';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor.js';
import { RedisModule } from './common/redis/redis.module.js';
import { AuthModule } from './auth/auth.module.js';
import { validate } from './config/env.validation.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { MetricsController } from './observability/metrics.controller.js';
import { QueueMetricsService } from './observability/queue-metrics.service.js';
import { SentrySmokeController } from './observability/sentry-smoke.controller.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { RealtimeModule } from './realtime/realtime.module.js';
import { StorageModule } from './storage/storage.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: [
        resolve(process.cwd(), '.env.local'),
        resolve(process.cwd(), '.env'),
        resolve(process.cwd(), '../../.env.local'),
        resolve(process.cwd(), '../../.env'),
      ],
    }),
    DatabaseModule,
    RedisModule,
    AuditModule,
    NotificationsModule,
    RealtimeModule,
    StorageModule,
    HealthModule,
    AuthModule,
    UsersModule,
    JobsModule,
    ProjectsModule,
    AiModule,
  ],
  controllers: [AppController, SentrySmokeController, MetricsController],
  providers: [
    AppService,
    QueueMetricsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimitInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AdminAuditInterceptor,
    },
  ],
})
export class AppModule {}
