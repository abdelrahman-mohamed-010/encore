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
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/supabase/client",
              message:
                "Database reads belong in features/*/queries.ts and writes in a server action. The browser client is only for Supabase auth, storage uploads and edge functions.",
            },
          ],
        },
      ],
    },
  },
  {
    // Supabase auth must run in the browser to set the session cookie; storage
    // uploads and edge-function invokes stream straight from the client.
    files: [
      "src/app/auth/**/*.tsx",
      "src/components/auth/**/*.tsx",
      "src/components/layout/user-menu.tsx",
      "src/components/ui/image-upload.tsx",
      "src/app/(site)/account/settings/settings-form.tsx",
      "src/components/dashboard/organizer-settings-form.tsx",
      "src/components/dashboard/report-download.tsx",
      "src/lib/supabase/client.ts",
    ],
    rules: { "no-restricted-imports": "off" },
  },
]);

export default eslintConfig;
