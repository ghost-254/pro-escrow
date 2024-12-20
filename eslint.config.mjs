import pluginNext from '@next/eslint-plugin-next'
import parser from '@typescript-eslint/parser' // Optional, if using TypeScript
console.log()
export default [
  {
    name: 'ESLint Config - nextjs',
    languageOptions: {
      parser, // Optional if using TypeScript
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true, // Enable JSX syntax
        },
      },
    },
    plugins: {
      '@next/next': pluginNext, // Use Next.js plugin
    },
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'], // Apply to all JS, JSX, TS, and TSX files
    rules: {
      ...pluginNext.configs.recommended.rules, // Enable recommended rules for Next.js
      ...pluginNext.configs['core-web-vitals'].rules, // Enable web vitals related rules
    },
  },
]
