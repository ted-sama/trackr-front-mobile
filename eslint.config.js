// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");
const eslintConfigPrettierRecommended = require("eslint-config-prettier/recommended");

module.exports = defineConfig([
  expoConfig,
  eslintConfigPrettierRecommended,
  {
    ignores: ["dist/*"],
  }
]);
