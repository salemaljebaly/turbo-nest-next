import { Injectable, Inject } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { user, asc, eq, gt, type Database } from '@repo/db';
import type {
  UserRecord,
  UsersListResponseDto,
} from './dto/user-response.dto.js';
import type { CursorPaginationQuery } from '@repo/types';
import { DATABASE_TOKEN } from '../database/database.module.js';
import { UserResponseDto } from './dto/user-response.dto.js';

@Injectable()
export class UsersService {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findCurrentUser(id: string): Promise<UserResponseDto> {
    const rows = await this.db.select().from(user).where(eq(user.id, id));
    const [found] = rows as UserRecord[];
    if (!found) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return UserResponseDto.from(found);
  }

  async listUsers(query: CursorPaginationQuery): Promise<UsersListResponseDto> {
    const { cursor, limit } = query;
    const rows = await this.db
      .select()
      .from(user)
      .where(cursor ? gt(user.id, cursor) : undefined)
      .orderBy(asc(user.id))
      .limit(limit + 1);

    const pageRows = (rows as UserRecord[]).slice(0, limit);
    const hasMore = rows.length > limit;

    return {
      items: pageRows.map((row) => UserResponseDto.from(row)),
      nextCursor: hasMore ? (pageRows.at(-1)?.id ?? null) : null,
      hasMore,
    };
  }
}
