import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

const simBans = [
  { object: "Math", property: "random", message: "Use the seeded RNG streams in sim/core/rng." },
  { object: "Math", property: "pow", message: "Use dmath.pow or dmath.powInt (engine-independent)." },
  { object: "Math", property: "exp", message: "Use dmath.exp (engine-independent)." },
  { object: "Math", property: "log", message: "Use dmath.log (engine-independent)." },
  { object: "Math", property: "sin", message: "Use dmath.sin (engine-independent)." },
  { object: "Math", property: "cos", message: "Use dmath.cos (engine-independent)." },
  { object: "Math", property: "tan", message: "Not allowed in the simulation." },
  { object: "Math", property: "atan2", message: "Not allowed in the simulation." },
  { object: "Date", property: "now", message: "The simulation has its own calendar." },
  { object: "performance", property: "now", message: "Not allowed in the simulation." },
];

export default tseslint.config(
  { ignores: ["dist", "node_modules", "public", "*.config.js"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["src/sim/**/*.ts", "src/data/**/*.ts"],
    rules: {
      "no-restricted-properties": ["error", ...simBans],
      "no-restricted-globals": ["error", { name: "Date", message: "The simulation has its own calendar." }],
      "no-restricted-syntax": [
        "error",
        { selector: "NewExpression[callee.name='Date']", message: "The simulation has its own calendar." },
      ],
    },
  },
);
