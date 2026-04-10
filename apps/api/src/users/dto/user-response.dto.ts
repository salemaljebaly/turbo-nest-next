import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  emailVerified!: boolean;

  @ApiProperty({ required: false, nullable: true })
  image!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static from(user: Record<string, unknown>): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id as string;
    dto.name = user.name as string;
    dto.email = user.email as string;
    dto.emailVerified = user.emailVerified as boolean;
    dto.image = (user.image as string) ?? null;
    dto.createdAt = user.createdAt as Date;
    dto.updatedAt = user.updatedAt as Date;
    return dto;
  }
}
