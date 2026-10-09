import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

const TypeScriptRules = {
  "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  "@typescript-eslint/no-explicit-any": "warn",
};

const ReactHooksRules = {
  "react-hooks/rules-of-hooks": "error",
  "react-hooks/exhaustive-deps": "warn",
};

const ReactRefreshRules = {
  "react-refresh/only-export-components": [
    "warn",
    { allowConstantExport: true },
  ],
};

export default [
  { ignores: ["dist", "dist-electron", "node_modules", "out", "app"] },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        BrowserWindow: "readonly",
        ipcRenderer: "readonly",
      },
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...TypeScriptRules,
      ...ReactHooksRules,
      ...ReactRefreshRules,
    },
  },
];
