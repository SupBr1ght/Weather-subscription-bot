module.exports = {
    env: {
      browser: true,
      es2021: true,
    },
    extends: ["eslint:recommended", "prettier"],
    rules: {
      "no-console": "on",
      "no-extra-parens": ["error", "all", { nestedBinaryExpressions: false }],
      "no-extra-parens": "off",
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.object.name='console'][callee.property.name!=/^(log|warn|error|info|trace)$/]",
          message: "Unexpected property on console object was called",
        },
      ],
    },
  
    prettier: {
      trailingComma: "none",
    },
  };
  