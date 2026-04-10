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
  },
);
