import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';

process.env['DATABASE_URL'] ??=
  'postgresql://postgres:postgres@localhost:5432/appdb';
process.env['BETTER_AUTH_URL'] ??= 'http://localhost:3001';
process.env['BETTER_AUTH_SECRET'] ??=
  'openapi-generation-secret-at-least-32-chars';
process.env['APP_URL'] ??= 'http://localhost:3000';

async function generateOpenApi() {
  const [{ AppModule }, { configureApp, createOpenApiDocument }] =
    await Promise.all([import('./app.module.js'), import('./app.setup.js')]);

  const app = await NestFactory.create(AppModule, { logger: false });

  configureApp(app);

  const document = createOpenApiDocument(app);
  const outputPath = resolve(process.cwd(), 'openapi.json');

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  await app.close();
}

generateOpenApi().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
