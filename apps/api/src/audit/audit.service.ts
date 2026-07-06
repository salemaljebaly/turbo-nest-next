import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { auditLog, type Database } from '@repo/db';
import { DATABASE_TOKEN } from '../database/database.module.js';

export type AuditInput = {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  diff?: Record<string, unknown>;
};

@Injectable()
export class AuditService {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async record(input: AuditInput) {
    await this.db.insert(auditLog).values({
      id: randomUUID(),
      userId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      diff: input.diff,
    });
  }
}
