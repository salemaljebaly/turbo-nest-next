import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly config: ConfigService) {}

  getHello(): string {
    const appName = this.config.get<string>('APP_NAME', 'API');
    this.logger.log(`getHello called — app: ${appName}`);
    return `Hello from ${appName}!`;
  }
}
