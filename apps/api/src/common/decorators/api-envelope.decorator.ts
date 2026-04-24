import { applyDecorators, SetMetadata, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export const API_ENVELOPE_SKIP_KEY = 'apiEnvelope:skip';

export const SkipApiEnvelope = () => SetMetadata(API_ENVELOPE_SKIP_KEY, true);

interface ApiEnvelopeOptions {
  description?: string;
  isArray?: boolean;
}

export function ApiEnvelopeOkResponse(
  model: Type<unknown>,
  options: ApiEnvelopeOptions = {},
) {
  const dataSchema = options.isArray
    ? {
        type: 'array',
        items: { $ref: getSchemaPath(model) },
      }
    : { $ref: getSchemaPath(model) };

  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      description: options.description,
      schema: {
        type: 'object',
        required: ['success', 'data'],
        properties: {
          success: { type: 'boolean', enum: [true] },
          data: dataSchema,
          message: { type: 'string' },
        },
      },
    }),
  );
}
