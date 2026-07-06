import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { and, eq, storageObjects, type Database } from '@repo/db';
import { Inject } from '@nestjs/common';
import { DATABASE_TOKEN } from '../database/database.module.js';
import { AppException } from '../common/errors/app.exception.js';
import type { CreateUploadDto } from './dto/create-upload.dto.js';

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/csv',
]);

@Injectable()
export class StorageService {
  private readonly client: S3Client | null;

  constructor(
    private readonly config: ConfigService,
    @Inject(DATABASE_TOKEN) private readonly db: Database,
  ) {
    const endpoint = this.config.get<string>('STORAGE_ENDPOINT');
    this.client = endpoint
      ? new S3Client({
          endpoint,
          region: this.config.get<string>('STORAGE_REGION', 'us-east-1'),
          forcePathStyle: true,
          credentials: {
            accessKeyId: this.config.get<string>('STORAGE_ACCESS_KEY', ''),
            secretAccessKey: this.config.get<string>('STORAGE_SECRET_KEY', ''),
          },
        })
      : null;
  }

  async createPresignedUpload(ownerId: string, dto: CreateUploadDto) {
    if (!this.client) throw new AppException('STORAGE_NOT_CONFIGURED');
    if (!allowedMimeTypes.has(dto.mimeType)) {
      throw new AppException('STORAGE_VALIDATION_FAILED', undefined, {
        mimeType: dto.mimeType,
      });
    }

    const bucket = this.config.get<string>('STORAGE_BUCKET', 'uploads');
    const id = randomUUID();
    const key = `uploads/${ownerId}/${id}`;
    await this.db.insert(storageObjects).values({
      id,
      ownerId,
      key,
      bucket,
      mimeType: dto.mimeType,
      sizeBytes: String(dto.sizeBytes),
    });

    const uploadUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: dto.mimeType,
        ContentLength: dto.sizeBytes,
      }),
      { expiresIn: 600 },
    );
    return { id, key, bucket, uploadUrl, expiresInSeconds: 600 };
  }

  async confirm(ownerId: string, id: string) {
    const [object] = await this.db
      .update(storageObjects)
      .set({ status: 'confirmed', confirmedAt: new Date() })
      .where(
        and(eq(storageObjects.id, id), eq(storageObjects.ownerId, ownerId)),
      )
      .returning();
    if (!object) {
      throw new AppException('NOT_FOUND', 'Upload not found');
    }
    return object;
  }

  async healthCheck() {
    if (!this.client) return;
    return;
  }
}
