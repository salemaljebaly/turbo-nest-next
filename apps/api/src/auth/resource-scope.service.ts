import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Session } from './auth.js';

@Injectable()
export class ResourceScopeService {
  allowedScopes(session: Session, scopeKey: string): string[] | null {
    const metadata = session.session as unknown as {
      resourceScopes?: Record<string, string[]>;
    };
    return metadata.resourceScopes?.[scopeKey] ?? null;
  }

  assertAllowed(session: Session, scopeKey: string, value?: string | null) {
    const allowed = this.allowedScopes(session, scopeKey);
    if (!allowed || !value || allowed.includes(value)) return;
    throw new ForbiddenException({
      code: 'FORBIDDEN',
      message: `You can only access records in your ${scopeKey} scope`,
    });
  }
}
