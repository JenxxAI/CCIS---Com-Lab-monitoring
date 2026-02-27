import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default tseslint.config(
  // ── Global ignores ───────────────────────────────────────────────────────
  { ignores: ['dist', 'server', 'node_modules'] },

  // ── Base rules ───────────────────────────────────────────────────────────
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ── React / TS source files ──────────────────────────────────────────────
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // React hooks
      ...reactHooks.configs.recommended.rules,

      // React Refresh — warn on non-component exports
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // Relax a few TS rules for pragmatism
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Allow empty catch blocks (used for offline fallback)
      '@typescript-eslint/no-empty-function': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
)
