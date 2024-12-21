module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Enforce blank line before the body
    'body-leading-blank': [2, 'always'],
    // Limit body line length for readability
    'body-max-line-length': [2, 'always', 100],
    // Enforce blank line before footer
    'footer-leading-blank': [2, 'always'],
    // Limit footer line length for readability
    'footer-max-line-length': [2, 'always', 100],
    // Limit header length for concise commit messages
    'header-max-length': [2, 'always', 72],
    // Scope must be in lowercase
    'scope-case': [2, 'always', 'lower-case'],
    // Subject must not use specific cases
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
    // Subject must not be empty
    'subject-empty': [2, 'never'],
    // Subject must not end with a full stop
    'subject-full-stop': [2, 'never', '.'],
    // Type must be in lowercase
    'type-case': [2, 'always', 'lower-case'],
    // Type must not be empty
    'type-empty': [2, 'never'],
    // Enforce allowed commit types for standardization
    'type-enum': [
      2,
      'always',
      [
        'build', // Build system changes (e.g., gulp, npm)
        'chore', // General maintenance tasks
        'ci', // CI/CD-related changes
        'docs', // Documentation updates
        'feat', // New features
        'fix', // Bug fixes
        'perf', // Performance improvements
        'refactor', // Code changes without fixing bugs or adding features
        'revert', // Reverts previous commits
        'style', // Code styling (e.g., formatting, missing semi-colons)
        'test', // Adding or updating tests
        'translation', // Localization or translations
        'security', // Security improvements or fixes
        'changeset', // Change management-related updates
      ],
    ],
  },
}
