import sharedConfig from "@lila/config/eslint-next";

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...sharedConfig,
  {
    ignores: ["eslint.config.mjs"],
    settings: {
      next: {
        rootDir: "apps/marketing",
      },
    },
  },
];
