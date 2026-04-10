import { All, Controller, Inject, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { AUTH_TOKEN } from './auth.js';
import type { Auth } from './auth.js';

/**
 * Passes all /api/auth/* requests directly to Better Auth.
 * This gives you: /api/auth/sign-in, /api/auth/sign-up, /api/auth/sign-out, etc.
 */
@Controller('auth')
export class AuthController {
  constructor(@Inject(AUTH_TOKEN) private readonly auth: Auth) {}

  @All('*path')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    return toNodeHandler(this.auth)(req, res);
  }
}
