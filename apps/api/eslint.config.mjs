// @ts-check
import { config } from '@repo/eslint-config/nestjs';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...config,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@repo/ui',
              message:
                'The API must stay UI-free so it can be deployed or extracted independently.',
            },
          ],
          patterns: [
            {
              group: ['@repo/ui/*', '@/components/*', '@/app/*'],
              message: 'Backend code must not import frontend/UI modules.',
            },
          ],
        },
      ],
    },
  },
);
