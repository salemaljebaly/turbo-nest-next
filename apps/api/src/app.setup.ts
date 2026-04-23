import {
  INestApplication,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

export function parseCorsOrigins(config: ConfigService): string[] {
  return config
    .get<string>('CORS_ORIGINS', 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function configureApp(app: INestApplication) {
  const config = app.get(ConfigService);

  app.use(helmet());

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({
    origin: parseCorsOrigins(config),
    credentials: true,
  });

  const document = createOpenApiDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}

export function createOpenApiDocument(
  app: INestApplication,
  config = app.get(ConfigService),
): OpenAPIObject {
  const swaggerConfig = new DocumentBuilder()
    .setTitle(config.get<string>('APP_NAME', 'API'))
    .setDescription('REST API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  return SwaggerModule.createDocument(app, swaggerConfig);
}

export function logAppStartup(logger: Logger, port: number) {
  logger.log(`Application running on http://localhost:${port}/api`);
  logger.log(`Swagger docs    → http://localhost:${port}/api/docs`);
  logger.log(`Health check    → http://localhost:${port}/api/health`);
}
