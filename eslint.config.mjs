import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  /**
   * The lines Wave 2 drew (ROADMAP-EXECUTION.md, C2.3). Each is a way screens
   * drifted from the API or from each other before.
   */
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/lib/auth/**",
      "src/lib/hooks/use-auth.ts",
      "src/lib/hooks/use-session.ts",
      "src/lib/hooks/use-can.ts",
      "src/lib/utils/**",
      "src/stores/**",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name='hasRole']",
          message:
            "Ask can('action') (lib/hooks/use-can) instead of naming roles. Roles belong to the API's action registry.",
        },
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.property.name='hasRole']",
          message:
            "Ask can('action') (lib/hooks/use-can) instead of naming roles. Roles belong to the API's action registry.",
        },
        {
          selector: "MemberExpression[property.name='systemRoles']",
          message:
            "Decide from actions — can('x'), or lib/auth/landing — not from the roles themselves.",
        },
        {
          selector: "Literal[value=/₦/]",
          message:
            "Format money with lib/utils/format (the tenant's currency), not a hard-coded ₦.",
        },
        {
          selector: "TemplateElement[value.raw=/₦/]",
          message:
            "Format money with lib/utils/format (the tenant's currency), not a hard-coded ₦.",
        },
        {
          selector:
            "CallExpression[callee.property.name=/^toLocale(Date|Time)String$/]",
          message:
            "Format dates with lib/utils/dates (formatDate, formatDateTime, formatDayOfWeek…), the house styles.",
        },
        {
          selector:
            "CallExpression[callee.property.name='toLocaleString'][arguments.0.type='Literal']",
          message:
            "Format numbers and dates with lib/utils, so every screen writes them the same way.",
        },
        {
          selector:
            "CallExpression[callee.property.name='toLocaleString'][arguments.0.value='en-NG']",
          message:
            "Format numbers and dates with lib/utils, so every screen writes them the same way.",
        },
      ],
    },
  },
  {
    // Screens reach the API through hooks, which own caching, invalidation
    // and error toasts. Types may still be imported.
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/api", "@/lib/api/*"],
              allowTypeImports: true,
              message:
                "Call the API through a hook in lib/hooks (or the feature's hooks), not from the screen.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The product film (video/README.md): a standalone render tool, not app code.
    "video/**",
  ]),
]);

export default eslintConfig;
