import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { AiController } from './ai.controller.js';
import { AiService } from './ai.service.js';

@Module({
  imports: [AuthModule, ProjectsModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
