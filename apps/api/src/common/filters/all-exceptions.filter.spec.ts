import { InternalServerErrorException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

describe('AllExceptionsFilter', () => {
  it('logs internal errors without leaking SQL, stack, or details to clients', () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const request = {
      method: 'PATCH',
      url: '/api/v1/admin/config/1',
      context: { requestId: 'request-1' },
    };
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => request,
      }),
    };
    const observability = { captureException: vi.fn() };
    const filter = new AllExceptionsFilter(observability);

    filter.catch(
      new InternalServerErrorException({
        code: 'SQL_FAILURE',
        message: 'select * from secret_table',
        query: 'select * from secret_table',
      }),
      host as never,
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        requestId: 'request-1',
        path: '/api/v1/admin/config/1',
        timestamp: expect.any(String),
      },
    });
    expect(observability.captureException).toHaveBeenCalledOnce();
  });
});
