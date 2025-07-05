import globals from "globals";

export default [
  {
    ignores: [
      "node_modules/**",
      ".vscode-test/**",
      "dist/**",
      "out/**",
      "*.min.js",
      "*.css"
    ],
    files: ["extension.js", "test/*.js"],
    languageOptions: {
      sourceType: "commonjs", // Match CommonJS syntax
      globals: {
        ...globals.node, // Includes require, module, __dirname, etc.
        ...globals.mocha // Includes suite, test, etc.
      },
      ecmaVersion: 2022
    },
    rules: {
      "no-const-assign": "warn",
      "no-this-before-super": "warn",
      "no-undef": "off", // Disable no-undef to avoid errors for now
      "no-unreachable": "warn",
      "no-unused-vars": "warn",
      "constructor-super": "warn",
      "valid-typeof": "warn"
    }
  }
];
