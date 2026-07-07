import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, projects, sql, type Database } from '@repo/db';
import { DATABASE_TOKEN } from '../database/database.module.js';
import { AppException } from '../common/errors/app.exception.js';
import { assertDifferentActor } from '../auth/separation-of-duties.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import {
  boundedIntegerLimit,
  containsLikePattern,
  parseSort,
  validateUuidCursor,
} from '../common/query-safety.js';
import type { CreateProjectDto } from './dto/create-project.dto.js';
import type { ListProjectsDto } from './dto/list-projects.dto.js';
import type { UpdateProjectDto } from './dto/update-project.dto.js';

const sortColumns = ['name', 'createdAt'] as const;
type ProjectRow = {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  status: string;
  requestedById: string | null;
  approvedById: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(ownerId: string, dto: CreateProjectDto) {
    const [project] = await this.db
      .insert(projects)
      .values({
        id: randomUUID(),
        ownerId,
        requestedById: ownerId,
        name: dto.name,
        description: dto.description,
      })
      .returning();
    this.realtime.emitToUser(ownerId, 'project.updated', project);
    return project;
  }

  async list(ownerId: string, query: ListProjectsDto) {
    const limit = boundedIntegerLimit(query.limit, 20);
    const cursor = validateUuidCursor(query.cursor);
    const sort = parseSort(query.sort, sortColumns, {
      column: 'createdAt',
      direction: 'desc',
    });
    const search = containsLikePattern(query.search);
    const where = and(
      eq(projects.ownerId, ownerId),
      cursor ? gt(projects.id, cursor) : undefined,
      search ? sql`${projects.name} ILIKE ${search} ESCAPE '\\'` : undefined,
    );
    const orderBy =
      sort.column === 'name'
        ? sort.direction === 'asc'
          ? sql`${projects.name} ASC`
          : sql`${projects.name} DESC`
        : sort.direction === 'asc'
          ? sql`${projects.createdAt} ASC`
          : sql`${projects.createdAt} DESC`;

    const rows = await this.db
      .select()
      .from(projects)
      .where(where)
      .orderBy(orderBy)
      .limit(limit + 1);

    return {
      rows: rows.slice(0, limit),
      nextCursor: rows.length > limit ? rows[limit]!.id : null,
    };
  }

  async get(ownerId: string, id: string): Promise<ProjectRow> {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(and(eq(projects.ownerId, ownerId), eq(projects.id, id)));
    if (!project) throw new AppException('PROJECT_NOT_FOUND');
    return project;
  }

  async getForApproval(id: string): Promise<ProjectRow> {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    if (!project) throw new AppException('PROJECT_NOT_FOUND');
    return project;
  }

  async update(ownerId: string, id: string, dto: UpdateProjectDto) {
    const existing = await this.get(ownerId, id);
    if (existing.status === 'archived') {
      throw new AppException('PROJECT_ARCHIVED');
    }
    const [project] = await this.db
      .update(projects)
      .set({ ...dto, updatedAt: new Date() })
      .where(and(eq(projects.ownerId, ownerId), eq(projects.id, id)))
      .returning();
    if (!project) throw new AppException('PROJECT_NOT_FOUND');
    this.realtime.emitToUser(ownerId, 'project.updated', project);
    return project;
  }

  async approve(approverId: string, id: string) {
    const project = await this.getForApproval(id);
    if (project.status === 'archived') {
      throw new AppException('PROJECT_ARCHIVED');
    }
    assertDifferentActor(project.requestedById ?? project.ownerId, approverId);
    const [approved] = await this.db
      .update(projects)
      .set({
        status: 'approved',
        approvedById: approverId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();
    if (!approved) throw new AppException('PROJECT_NOT_FOUND');
    this.realtime.emitToUser(project.ownerId, 'project.updated', approved);
    await this.notifications.queue(
      project.ownerId,
      'Project approved',
      `${approved?.name ?? 'Project'} was approved.`,
    );
    return approved;
  }

  async exportRows(ownerId: string): Promise<ProjectRow[]> {
    return this.db.select().from(projects).where(eq(projects.ownerId, ownerId));
  }
}
