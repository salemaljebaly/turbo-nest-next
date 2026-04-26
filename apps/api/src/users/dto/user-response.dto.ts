import { ApiProperty } from '@nestjs/swagger';
import type { user } from '@repo/db';

export type UserRecord = typeof user.$inferSelect;

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  emailVerified!: boolean;

  @ApiProperty({ type: String, required: false, nullable: true })
  image!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static from(user: UserRecord): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.email = user.email;
    dto.emailVerified = user.emailVerified;
    dto.image = user.image;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}

export class UsersListResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  items!: UserResponseDto[];

  @ApiProperty({ type: String, nullable: true })
  nextCursor!: string | null;

  @ApiProperty()
  hasMore!: boolean;
}
