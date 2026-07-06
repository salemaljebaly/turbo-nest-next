import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENT_KEY = 'todo:idempotent';

export const Idempotent = () => SetMetadata(IDEMPOTENT_KEY, true);
