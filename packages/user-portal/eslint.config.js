import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        document: 'readonly',
        window: 'readonly',
        FormData: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLElement: 'readonly',
        localStorage: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...react.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // React hooks rules for better performance and fewer bugs
      // Note: react-hooks/exhaustive-deps disabled due to ESLint v9 compatibility issue
      // TODO: Re-enable when react-hooks plugin supports ESLint v9
      // 'react-hooks/exhaustive-deps': 'warn', // Catch stale closure bugs
      'react-hooks/rules-of-hooks': 'error', // Enforce proper hook usage
      // Disable prop-types since we use TypeScript
      'react/prop-types': 'off',
      // Add localStorage global
      'no-undef': 'off', // TypeScript handles this
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    ignores: ['dist/**', '.eslintrc.js'],
  },
];