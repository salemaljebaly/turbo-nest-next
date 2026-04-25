import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Lamah' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com/avatar.png',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  image?: string | null;
}
