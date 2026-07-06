import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createQueue, QUEUE_NAMES } from '@repo/jobs';
import { metrics } from './metrics.js';

@Injectable()
export class QueueMetricsService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(QueueMetricsService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    if (!this.config.get<string>('REDIS_URL')) return;
    void this.collect();
    this.timer = setInterval(() => void this.collect(), 30_000);
    this.timer.unref();
  }

  onApplicationShutdown() {
    if (this.timer) clearInterval(this.timer);
  }

  private async collect() {
    const queueNames = [...new Set(Object.values(QUEUE_NAMES))];
    await Promise.all(
      queueNames.map(async (queueName) => {
        const queue = createQueue(queueName);
        try {
          const counts = await queue.getJobCounts(
            'waiting',
            'active',
            'delayed',
            'failed',
          );
          for (const [state, count] of Object.entries(counts)) {
            metrics.gauge(
              'todo_bullmq_jobs',
              'BullMQ job count by queue and state',
              { queue: queueName, state },
              count,
            );
          }
          const [oldest] = await queue.getJobs(['waiting'], 0, 0, true);
          metrics.gauge(
            'todo_bullmq_oldest_waiting_seconds',
            'Age in seconds of the oldest waiting BullMQ job',
            { queue: queueName },
            oldest ? Math.max(0, (Date.now() - oldest.timestamp) / 1000) : 0,
          );
        } catch (error) {
          this.logger.warn(
            JSON.stringify({
              event: 'queue_metrics_collection_failed',
              queue: queueName,
              error: error instanceof Error ? error.message : String(error),
            }),
          );
        } finally {
          await queue.close();
        }
      }),
    );
  }
}
