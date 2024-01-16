module.exports = {
  plugins: ['@typescript-eslint', 'simple-import-sort', 'unicorn'],
  extends: [
    'next',
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    'simple-import-sort/imports': 'error',
    //"@typescript-eslint/prefer-for-of": "error",
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    'no-multiple-empty-lines': [1, { max: 1 }],
    'unicorn/consistent-function-scoping': 'error',
    'react/jsx-curly-brace-presence': [
      'error',
      { props: 'never', children: 'never' },
    ],
  },
};
