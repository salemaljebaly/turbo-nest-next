import { Injectable } from '@nestjs/common';
import { QUEUE_NAMES, enqueueJob } from '@repo/jobs';

@Injectable()
export class JobsService {
  async enqueuePing(message: string): Promise<void> {
    await enqueueJob(
      'template.ping',
      { message },
      {
        queue: QUEUE_NAMES.default,
      },
    );
  }
}
