import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import { AUTH_TOKEN } from './auth.js';
import type { Auth, Session } from './auth.js';

/** Express request enriched with the validated Better Auth session. */
export interface SessionRequest extends Request {
  session: Session;
}

/**
 * Guards a route by validating the Better Auth session cookie/token.
 *
 * Usage:
 *   @UseGuards(AuthGuard)
 *   @Get('protected')
 *   async protected(@Req() req: SessionRequest) {
 *     return req.session.user;
 *   }
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AUTH_TOKEN) private readonly auth: Auth) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const session = await this.auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) throw new UnauthorizedException('No valid session');

    // Attach to request so handlers can access it via @Req()
    (req as SessionRequest).session = session;
    return true;
  }
}
