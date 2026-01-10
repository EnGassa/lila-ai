import sharedConfig from "@lila/config/eslint-next";

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...sharedConfig,
  {
    ignores: [
      "eslint.config.mjs",
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "coverage/**",
      "**/sw.js",
    ],
    settings: {
      next: {
        rootDir: "apps/web",
      },
    },
  },
];
