import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/naming-convention': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'curly': 'warn',
      'eqeqeq': 'warn',
      'no-throw-literal': 'warn',
    },
  },
  {
    ignores: [
      'node_modules/**',
      'out/**',
      'crossnote/**',
      '**/*.d.ts',
      'scripts/build.js',
      'scripts/strip-preview-ui.js',
      'eslint.config.mjs',
      'media/**',
      'prettier.config.js',
    ],
  },
);
