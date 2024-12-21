import { defineConfig } from 'eslint'

export default defineConfig({
  extends: [
    'next/core-web-vitals',
    'plugin:@next/next/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  globals: {
    React: 'readonly',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'react/prop-types': 'off',
    'consistent-this': ['error', 'self'],
    'id-length': ['error', { min: 2, exceptions: ['i', 'j', 'k', 'e'] }],
    'grouped-accessor-pairs': 'error',
    'no-empty-function': 'error',
    'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 1 }],
    'no-unused-vars': 'error',
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
  },
})
