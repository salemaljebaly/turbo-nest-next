import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class EnqueuePingJobDto {
  @ApiProperty({ example: 'hello from the API' })
  @IsString()
  @MinLength(1)
  message!: string;
}

export class EnqueuePingJobResponseDto {
  @ApiProperty()
  queued!: boolean;

  @ApiProperty()
  message!: string;
}
