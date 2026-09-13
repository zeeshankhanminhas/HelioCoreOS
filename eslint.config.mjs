import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/app/dashboard/engineering/equipment/equipment-workspace.tsx"],
    rules: {
      "@next/next/no-assign-module-variable": "off",
    },
  },
  {
    files: [
      "src/lib/neon/load-profiles.ts",
      "src/app/dashboard/engineering/page.tsx",
      "src/app/dashboard/engineering/load-profiles/[id]/page.tsx",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
