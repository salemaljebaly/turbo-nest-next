import { Inject, Injectable } from '@nestjs/common';
import { and, eq, member, type Database } from '@repo/db';
import { DATABASE_TOKEN } from '../database/database.module.js';
import type { Session } from './auth.js';
import {
  parseRole,
  roleCan,
  type PermissionAction,
  type PermissionResource,
} from './permissions.js';

@Injectable()
export class PermissionsService {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async roleForSession(session: Session) {
    const organizationId = session.session.activeOrganizationId;
    if (!organizationId) return parseRole(undefined);

    const [row] = await this.db
      .select({ role: member.role })
      .from(member)
      .where(
        and(
          eq(member.userId, session.user.id),
          eq(member.organizationId, organizationId),
        ),
      )
      .limit(1);

    return parseRole(row?.role);
  }

  async can(
    session: Session,
    resource: PermissionResource,
    action: PermissionAction,
  ) {
    return roleCan(await this.roleForSession(session), resource, action);
  }
}
