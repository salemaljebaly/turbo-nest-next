import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: ["playwright-report/**", "test-results/**"],
  },
  ...nextJsConfig,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@repo/db",
              message:
                "The web app must use the API contract/client, not database internals.",
            },
            {
              name: "@repo/api",
              message:
                "The web app must stay deployable independently from the API package.",
            },
          ],
          patterns: [
            {
              group: ["@repo/db/*", "@repo/api/*"],
              message:
                "Frontend code must not import backend/database internals.",
            },
          ],
        },
      ],
    },
  },
];
