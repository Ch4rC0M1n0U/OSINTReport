import { execSync } from "node:child_process";
import { Client } from "pg";
import { randomUUID } from "node:crypto";

const globalState = globalThis as typeof globalThis & {
  __TEST_DB_INITIALIZED__?: boolean;
  __TEST_DB_NAME__?: string;
};

async function ensureTestDatabase() {
  if (globalState.__TEST_DB_INITIALIZED__) {
    return;
  }

  process.env.NODE_ENV = "test";

  const baseUrlEnv =
    process.env.DATABASE_URL ??
    "postgresql://osint_admin:change_me@localhost:55432/osint_db?schema=public";
  const baseUrl = new URL(baseUrlEnv);
  const originalDbName = baseUrl.pathname.slice(1) || `osint_db_${randomUUID()}`;
  const testDbName = `${originalDbName}_test`;

  baseUrl.pathname = `/${testDbName}`;
  const testDbUrl = baseUrl.toString();

  const adminUrl = new URL(baseUrlEnv);
  adminUrl.pathname = "/postgres";
  adminUrl.search = "";

  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();
  const exists = await client.query<{ exists: boolean }>(
    "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS exists",
    [testDbName]
  );

  if (!exists.rows[0]?.exists) {
    await client.query(`CREATE DATABASE "${testDbName}"`);
  }
  await client.end();

  process.env.DATABASE_URL = testDbUrl;
  process.env.JWT_ACCESS_SECRET ??= "A".repeat(64);
  process.env.JWT_REFRESH_SECRET ??= "B".repeat(64);
  process.env.FRONTEND_URL ??= "http://localhost:5173";
  process.env.BACKEND_URL ??= "http://localhost:4000";
  process.env.ADMIN_EMAIL ??= "admin.test@osint.local";
  process.env.ADMIN_PASSWORD ??= "ChangeMeAdmin42!";
  process.env.ADMIN_FIRST_NAME ??= "Admin";
  process.env.ADMIN_LAST_NAME ??= "Test";

  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: testDbUrl },
  });

  globalState.__TEST_DB_INITIALIZED__ = true;
  globalState.__TEST_DB_NAME__ = testDbName;
}

await ensureTestDatabase();
