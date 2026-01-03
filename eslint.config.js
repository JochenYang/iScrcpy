export default [
  { ignores: ['dist', 'dist-electron', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { BrowserWindow: 'readonly', ipcRenderer: 'readonly', process: 'readonly' },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.2' } },
    plugins: {
      react: {},
      'react-hooks': {},
      '@typescript-eslint': {},
    },
    rules: {
      ...ReactHooksRules,
      ...ReactRules,
      ...TypeScriptRules,
    },
  },
]
const ReactRules = {
  'react/jsx-no-target-blank': 'off',
  'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
}
const ReactHooksRules = {
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',
}
const TypeScriptRules = {
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/no-explicit-any': 'warn',
}
