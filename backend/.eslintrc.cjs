module.exports = {
  env: {
    node: true,
    es2020: true
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [
    'node'
  ],
  rules: {
    'node/no-missing-import': 'off',
    'node/no-unsupported-features/es-syntax': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'warn'
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '*.test.js'
  ]
};