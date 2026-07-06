import { BadRequestException } from '@nestjs/common';

export function assertDifferentActor(createdBy: string, approvedBy: string) {
  if (createdBy === approvedBy) {
    throw new BadRequestException({
      code: 'SEPARATION_OF_DUTIES_VIOLATION',
      message: 'The requester and approver must be different users',
    });
  }
}
