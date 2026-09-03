/**
 * Boots the mock Supabase API, then the built Next.js server pointed at it.
 * Playwright uses this as its `webServer` command.
 */
import { spawn } from "node:child_process";
import { createMockSupabase } from "./mock-supabase.mjs";

const MOCK_PORT = Number(process.env.MOCK_PORT ?? 54321);
const APP_PORT = Number(process.env.PORT ?? 3100);

await createMockSupabase(MOCK_PORT);
console.log(`[stack] mock supabase on :${MOCK_PORT}`);

const next = spawn("npx", ["next", "start", "--port", String(APP_PORT)], {
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${MOCK_PORT}`,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    NEXT_PUBLIC_SITE_URL: `http://127.0.0.1:${APP_PORT}`,
    SUPABASE_SERVER_SECRET: "test-server-secret",
  },
});

const shutdown = () => { next.kill("SIGTERM"); process.exit(0); };
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
next.on("exit", (code) => process.exit(code ?? 0));
