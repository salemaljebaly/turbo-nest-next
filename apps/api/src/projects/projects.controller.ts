import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthGuard, type SessionRequest } from '../auth/auth.guard.js';
import {
  PermissionsGuard,
  RequirePermissions,
} from '../auth/permissions.guard.js';
import { AuditAction } from '../audit/admin-audit.interceptor.js';
import { SkipApiEnvelope } from '../common/decorators/api-envelope.decorator.js';
import { Idempotent } from '../common/decorators/idempotent.decorator.js';
import { RateLimit } from '../common/decorators/rate-limit.decorator.js';
import { writeCsv } from '../common/csv-response.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { ListProjectsDto } from './dto/list-projects.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { ProjectsService } from './projects.service.js';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionsGuard)
@Controller({ path: 'projects', version: '1' })
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post()
  @Idempotent()
  @RequirePermissions({ resource: 'projects', action: 'create' })
  @AuditAction('project.create', 'project')
  @ApiOperation({ summary: 'Create a project' })
  create(@Req() request: SessionRequest, @Body() dto: CreateProjectDto) {
    return this.projects.create(request.session.user.id, dto);
  }

  @Get()
  @RateLimit({ limit: 60, windowSeconds: 60 })
  @RequirePermissions({ resource: 'projects', action: 'list' })
  @ApiOperation({ summary: 'List projects with safe pagination and sorting' })
  list(@Req() request: SessionRequest, @Query() query: ListProjectsDto) {
    return this.projects.list(request.session.user.id, query);
  }

  @Get('export.csv')
  @SkipApiEnvelope()
  @RequirePermissions({ resource: 'projects', action: 'export' })
  @ApiOperation({ summary: 'Export projects as CSV' })
  async exportCsv(@Req() request: SessionRequest, @Res() response: Response) {
    const rows = await this.projects.exportRows(request.session.user.id);
    writeCsv(response, 'projects.csv', rows, [
      { header: 'ID', key: 'id' },
      { header: 'Name', key: 'name' },
      { header: 'Status', key: 'status' },
      { header: 'Created At', key: 'createdAt' },
    ]);
  }

  @Get(':id')
  @RequirePermissions({ resource: 'projects', action: 'read' })
  @ApiOperation({ summary: 'Get a project' })
  get(@Req() request: SessionRequest, @Param('id') id: string) {
    return this.projects.get(request.session.user.id, id);
  }

  @Patch(':id')
  @RequirePermissions({ resource: 'projects', action: 'update' })
  @AuditAction('project.update', 'project')
  @ApiOperation({ summary: 'Update a project' })
  update(
    @Req() request: SessionRequest,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.update(request.session.user.id, id, dto);
  }

  @Post(':id/approve')
  @RequirePermissions({ resource: 'projects', action: 'approve' })
  @AuditAction('project.approve', 'project')
  @ApiOperation({ summary: 'Approve a project with maker-checker protection' })
  approve(@Req() request: SessionRequest, @Param('id') id: string) {
    return this.projects.approve(
      request.session.user.id,
      id,
      request.session.user.id,
    );
  }
}
