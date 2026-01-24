export default {
  env: {
    es2021: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "no-undef": "off", // 🔥 necesario para Firebase
    "quotes": ["error", "double", { "allowTemplateLiterals": true }],
    "require-jsdoc": "off",
    "object-curly-spacing": ["error", "always"],
  },
};
