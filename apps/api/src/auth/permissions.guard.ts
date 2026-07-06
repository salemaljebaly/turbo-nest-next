import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { SessionRequest } from './auth.guard.js';
import { PermissionsService } from './permissions.service.js';
import type { PermissionAction, PermissionResource } from './permissions.js';

const PERMISSIONS_METADATA_KEY = 'todo:permissions';

type RequiredPermission = {
  resource: PermissionResource;
  action: PermissionAction;
};

export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(PERMISSIONS_METADATA_KEY, permissions);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissions: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<RequiredPermission[]>(
      PERMISSIONS_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<SessionRequest>();
    for (const permission of required) {
      const allowed = await this.permissions.can(
        request.session,
        permission.resource,
        permission.action,
      );
      if (!allowed) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: `You are not allowed to ${permission.action} ${permission.resource}`,
        });
      }
    }
    return true;
  }
}
