import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { auditLog, user, asc, eq, gt, type Database } from '@repo/db';
import type {
  UserRecord,
  UsersListResponseDto,
} from './dto/user-response.dto.js';
import type { CursorPaginationQuery } from '@repo/types';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';
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

  async updateUserProfile(
    userId: string,
    data: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const updates: Partial<Pick<UserRecord, 'name' | 'image' | 'updatedAt'>> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updates.name = data.name;
    if (data.image !== undefined) updates.image = data.image;

    if (updates.name === undefined && updates.image === undefined) {
      throw new BadRequestException('At least one profile field is required');
    }

    return this.db.transaction(async (tx: Database) => {
      const [updated] = (await tx
        .update(user)
        .set(updates)
        .where(eq(user.id, userId))
        .returning()) as UserRecord[];

      if (!updated) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      await tx.insert(auditLog).values({
        id: randomUUID(),
        userId,
        action: 'user.profile.update',
      });

      return UserResponseDto.from(updated);
    });
  }
}
