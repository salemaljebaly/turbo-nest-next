import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { configureApp, logAppStartup } from './app.setup.js';
import { initSentryFromEnv } from './observability/sentry.js';

async function bootstrap() {
  initSentryFromEnv();

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const logger = new Logger('Bootstrap');
  const config = app.get(ConfigService);

  configureApp(app);

  const port = config.get<number>('PORT', 3001);
  await app.listen(port);

  logAppStartup(logger, port);
}

void bootstrap();
