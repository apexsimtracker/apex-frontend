import path from "node:path";
import { fileURLToPath } from "node:url";

import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tailwindcss from "eslint-plugin-tailwindcss";
import globals from "globals";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/.pnpm-store/**",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    ...eslint.configs.recommended,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      react.configs.flat.recommended,
      react.configs.flat["jsx-runtime"],
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    settings: {
      react: {
        version: "detect",
      },
      tailwindcss: {
        callees: ["classnames", "clsx", "ctl", "cn", "cva"],
        config: path.join(__dirname, "tailwind.config.ts"),
      },
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      "react/prop-types": "off",
      // Existing patterns (reset-on-open, debounced state, etc.); changing would alter behavior.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/incompatible-library": "off",
      "preserve-caught-error": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  ...tailwindcss.configs["flat/recommended"].map((config) => ({
    ...config,
    files: ["**/*.{tsx,jsx}"],
  })),
  {
    files: ["**/*.{tsx,jsx}"],
    rules: {
      // After tailwind presets; opacity utilities like border-white/6 are valid but not in default allowlist.
      "tailwindcss/no-custom-classname": "off",
      "tailwindcss/no-unnecessary-arbitrary-value": "off",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
  },
  {
    files: ["vite.config.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
  },
  {
    files: ["**/*.{test,spec}.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.jest,
        vi: "readonly",
      },
    },
  },
  eslintConfigPrettier,
);
