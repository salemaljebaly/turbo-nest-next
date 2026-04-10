import { describe, it, expect } from 'vitest';
import { AppController } from './app.controller.js';
import type { AppService } from './app.service.js';

/**
 * Controller unit tests instantiate directly — no NestJS DI overhead.
 * NestJS's TestingModule.compile() relies on emitDecoratorMetadata which
 * esbuild (used by Vitest) does not emit. See vitest-e2e.config.ts for
 * integration tests that spin up the full application.
 */
describe('AppController', () => {
  const mockService: Pick<AppService, 'getHello'> = {
    getHello: () => 'Hello from TestApp!',
  };
  const controller = new AppController(mockService as AppService);

  it('should return a greeting string', () => {
    expect(controller.getHello()).toBe('Hello from TestApp!');
  });
});
