import { Body, Controller, Get, Patch, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiEnvelopeOkResponse } from '../common/decorators/api-envelope.decorator.js';
import { UsersService } from './users.service.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { AuthGuard, type SessionRequest } from '../auth/auth.guard.js';

/**
 * Example feature module demonstrating the full NestJS pattern:
 *  - Drizzle DB queries via injected DATABASE_TOKEN
 *  - Better Auth session guard on protected routes
 *  - Swagger decorators
 *  - URI versioning (/api/v1/users)
 */
@ApiTags('users')
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Get the currently authenticated user from session. */
  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current authenticated user record' })
  @ApiEnvelopeOkResponse(UserResponseDto, {
    description:
      'Current authenticated user wrapped in the standard API envelope',
  })
  async me(@Req() req: SessionRequest) {
    return this.usersService.findCurrentUser(req.session.user.id);
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the current user profile' })
  @ApiEnvelopeOkResponse(UserResponseDto, {
    description:
      'Updated authenticated user wrapped in the standard API envelope',
  })
  async updateMe(@Req() req: SessionRequest, @Body() body: UpdateProfileDto) {
    return this.usersService.updateUserProfile(req.session.user.id, body);
  }
}
