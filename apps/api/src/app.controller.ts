import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiEnvelopeOkResponse } from './common/decorators/api-envelope.decorator.js';
import { AppInfoDto } from './app.dto.js';
import { AppService } from './app.service.js';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiEnvelopeOkResponse(AppInfoDto, { description: 'API service information' })
  getHello(): AppInfoDto {
    return { message: this.appService.getHello() };
  }
}
