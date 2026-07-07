import {
  Controller,
  ForbiddenException,
  Get,
  Header,
  Logger,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { SkipApiEnvelope } from '../common/decorators/api-envelope.decorator.js';
import { metrics } from './metrics.js';

@ApiExcludeController()
@SkipApiEnvelope()
@Controller('metrics')
export class MetricsController {
  private readonly logger = new Logger(MetricsController.name);

  constructor(private readonly config: ConfigService) {}

  @Get()
  @Header('content-type', 'text/plain; version=0.0.4; charset=utf-8')
  read(@Req() request: Request) {
    const expected = this.metricsToken();
    if (!expected) {
      if (this.isProduction()) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'Metrics credentials are not configured',
        });
      }
      this.logger.warn(
        'Serving /metrics without credentials because METRICS_TOKEN is not configured outside production',
      );
      return metrics.render();
    }

    if (expected && !secureEqual(bearerToken(request), expected)) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Metrics credentials are invalid',
      });
    }
    return metrics.render();
  }

  private metricsToken() {
    const direct = this.config.get<string>('METRICS_TOKEN');
    if (direct) return direct;
    const path = this.config.get<string>('METRICS_TOKEN_FILE');
    if (!path) return undefined;
    try {
      return readFileSync(path, 'utf8').trim();
    } catch {
      return undefined;
    }
  }

  private isProduction() {
    return this.config.get<string>('NODE_ENV') === 'production';
  }
}

function bearerToken(request: Request) {
  const authorization = request.headers.authorization;
  return authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
}

function secureEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
