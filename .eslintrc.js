module.exports = {
  root: true,
  env: {
    node: true,
    browser: true
  },
  parser: '@typescript-eslint/parser',
  extends: [
    'standard-with-typescript'
  ],
  rules: {
    'no-void': 'off',
    'spaced-comment': ['error', 'always', { block: { exceptions: ['#__PURE__'] } }],
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/method-signature-style': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/promise-function-async': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/consistent-type-definitions': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/prefer-includes': 'off',
    '@typescript-eslint/no-invalid-void-type': 'off',
    '@typescript-eslint/member-delimiter-style': ['error', {
      multiline: {
        delimiter: 'none',
        requireLast: true
      },
      singleline: {
        delimiter: 'semi',
        requireLast: false
      }
    }]
  },
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    createDefaultProgram: true
  }
}
