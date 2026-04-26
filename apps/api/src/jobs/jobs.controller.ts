import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiEnvelopeOkResponse } from '../common/decorators/api-envelope.decorator.js';
import { AuthGuard } from '../auth/auth.guard.js';
import {
  EnqueuePingJobDto,
  EnqueuePingJobResponseDto,
} from './dto/enqueue-ping-job.dto.js';
import { JobsService } from './jobs.service.js';

@ApiTags('jobs')
@Controller({ path: 'jobs', version: '1' })
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('ping')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enqueue a template ping background job' })
  @ApiEnvelopeOkResponse(EnqueuePingJobResponseDto, {
    description: 'Queued ping job wrapped in the standard API envelope',
  })
  async enqueuePing(
    @Body() body: EnqueuePingJobDto,
  ): Promise<EnqueuePingJobResponseDto> {
    await this.jobsService.enqueuePing(body.message);

    return {
      queued: true,
      message: body.message,
    };
  }
}
