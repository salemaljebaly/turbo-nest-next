import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { tap, type Observable } from 'rxjs';
import type { SessionRequest } from '../auth/auth.guard.js';
import { AuditService } from './audit.service.js';

const AUDIT_ACTION_KEY = 'todo:audit-action';

export const AuditAction = (action: string, entityType: string) =>
  SetMetadata(AUDIT_ACTION_KEY, { action, entityType });

@Injectable()
export class AdminAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AdminAuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const metadata = this.reflector.getAllAndOverride<{
      action: string;
      entityType: string;
    }>(AUDIT_ACTION_KEY, [context.getHandler(), context.getClass()]);
    if (!metadata) return next.handle();

    const request = context.switchToHttp().getRequest<SessionRequest>();
    return next.handle().pipe(
      tap({
        next: () => {
          void this.audit
            .record({
              actorId: request.session.user.id,
              action: metadata.action,
              entityType: metadata.entityType,
              entityId:
                typeof request.params['id'] === 'string'
                  ? request.params['id']
                  : undefined,
              diff:
                request.body && typeof request.body === 'object'
                  ? (request.body as Record<string, unknown>)
                  : undefined,
            })
            .catch((error: unknown) =>
              this.logger.warn(
                error instanceof Error ? error.message : String(error),
              ),
            );
        },
      }),
    );
  }
}
