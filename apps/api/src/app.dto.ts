import { ApiProperty } from '@nestjs/swagger';

export class AppInfoDto {
  @ApiProperty()
  message!: string;
}
