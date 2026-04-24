import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export interface RequestContext {
  requestId: string;
}

export interface RequestWithContext extends Request {
  context: RequestContext;
}

export function requestContextMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const incomingRequestId = request.header('x-request-id')?.trim();
  const requestId = incomingRequestId || randomUUID();

  (request as RequestWithContext).context = { requestId };
  response.setHeader('x-request-id', requestId);

  next();
}
