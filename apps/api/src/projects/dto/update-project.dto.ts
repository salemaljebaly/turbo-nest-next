import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Launch checklist' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'Tasks and notes for the first release.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: ['active', 'archived'] })
  @IsOptional()
  @IsIn(['active', 'archived'])
  status?: 'active' | 'archived';
}
