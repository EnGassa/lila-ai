const nextVitals = require("eslint-config-next/core-web-vitals");
const nextTs = require("eslint-config-next/typescript");

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      "dist/**",
      "coverage/**",
      ".next/**",
      "out/**",
      "node_modules/**",
      "**/sw.js",
      "**/public/sw.js"
    ],
  },
];
