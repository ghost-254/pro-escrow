import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import storybook from 'eslint-plugin-storybook'

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  ...storybook.configs['flat/recommended'],
  {
    languageOptions: {
      globals: {
        React: 'readonly',
      },
    },
    rules: {
      'react/prop-types': 'off',
      'consistent-this': ['error', 'self'],
      'id-length': [
        'error',
        {
          min: 2,
          exceptions: ['i', 'j', 'k', 'e'],
        },
      ],
      'grouped-accessor-pairs': 'error',
      'no-empty-function': 'error',
      'no-multiple-empty-lines': [
        'error',
        {
          max: 1,
          maxBOF: 0,
          maxEOF: 1,
        },
      ],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-dupe-args': 'error',
      'no-invalid-this': 'error',
      'no-throw-literal': 'error',
      'no-useless-call': 'error',
      'consistent-return': 'error',
      'no-caller': 'error',
      'no-eval': 'error',
      'no-new-wrappers': 'error',
      'no-console': 'error',
      'no-undef': 'warn',
      'no-extra-semi': 'warn',
      'import/no-named-as-default': 'off',
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['*.stories.@(ts|tsx|js|jsx|mjs|cjs)'],
    rules: {
      'storybook/hierarchy-separator': 'error',
    },
  },
  {
    ignores: ['.next/**', 'build/**', 'node_modules/**', 'out/**', 'storybook-static/**'],
  },
]

export default config
