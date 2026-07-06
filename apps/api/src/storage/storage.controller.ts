import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, type SessionRequest } from '../auth/auth.guard.js';
import {
  PermissionsGuard,
  RequirePermissions,
} from '../auth/permissions.guard.js';
import { CreateUploadDto } from './dto/create-upload.dto.js';
import { StorageService } from './storage.service.js';

@ApiTags('storage')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionsGuard)
@Controller({ path: 'storage', version: '1' })
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post('uploads')
  @RequirePermissions({ resource: 'storage', action: 'create' })
  @ApiOperation({ summary: 'Create a presigned object upload URL' })
  createUpload(@Req() request: SessionRequest, @Body() dto: CreateUploadDto) {
    return this.storage.createPresignedUpload(request.session.user.id, dto);
  }

  @Post('uploads/:id/confirm')
  @RequirePermissions({ resource: 'storage', action: 'create' })
  @ApiOperation({ summary: 'Confirm a completed object upload' })
  confirm(@Req() request: SessionRequest, @Param('id') id: string) {
    return this.storage.confirm(request.session.user.id, id);
  }
}
