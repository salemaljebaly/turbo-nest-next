import { Injectable, Inject } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { user, eq, type Database } from '@repo/db';
import { DATABASE_TOKEN } from '../database/database.module.js';
import { UserResponseDto } from './dto/user-response.dto.js';

@Injectable()
export class UsersService {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findCurrentUser(id: string): Promise<UserResponseDto> {
    const [found] = await this.db.select().from(user).where(eq(user.id, id));
    if (!found) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return UserResponseDto.from(found);
  }
}
