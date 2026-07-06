import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { SessionRequest } from './auth.guard.js';
import { ResourceScopeService } from './resource-scope.service.js';

const RESOURCE_SCOPE_KEY = 'todo:resource-scope';

export type ResourceScopeOptions = {
  scopeKey: string;
  param?: string;
};

export const RequireResourceScope = (options: ResourceScopeOptions) =>
  SetMetadata(RESOURCE_SCOPE_KEY, options);

@Injectable()
export class ResourceScopeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly scopes: ResourceScopeService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<ResourceScopeOptions>(
      RESOURCE_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!options) return true;

    const request = context.switchToHttp().getRequest<SessionRequest>();
    const key = options.param ?? options.scopeKey;
    const requested =
      request.params[key] ??
      request.query[key] ??
      (request.body as Record<string, unknown> | undefined)?.[key];
    this.scopes.assertAllowed(
      request.session,
      options.scopeKey,
      typeof requested === 'string' ? requested : undefined,
    );
    return true;
  }
}
