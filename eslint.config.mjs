import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // TODO: flip to "error" once the last browser write becomes a server action.
      "no-restricted-imports": [
        "warn",
        {
          paths: [
            {
              name: "@/lib/supabase/client",
              message:
                "Reads belong in a features/*/queries.ts and writes in a server action. Only the auth flows and image upload may talk to the database from the browser.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "src/app/auth/**/*.tsx",
      "src/components/auth/**/*.tsx",
      "src/components/ui/image-upload.tsx",
      "src/lib/supabase/client.ts",
    ],
    rules: { "no-restricted-imports": "off" },
  },
]);

export default eslintConfig;
