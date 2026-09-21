// Creates the shared Postgres connection + Drizzle instance from DATABASE_URL.
// Consumers (apps/api, apps/web) are responsible for loading .env before this
// module runs (see apps/api's `--env-file` and apps/web's next.config.ts).
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Throws error if not reachable .env var is not available
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// On Cloud Run, Cloud SQL is reached through a unix socket directory (/cloudsql/PROJECT:REGION:INSTANCE)
// rather than a host, which a connection URL can't express, so it's passed as an option instead.
const socketPath = process.env.DB_SOCKET_PATH;

// Client function that connects to a Postgres server running
const client = postgres(connectionString, socketPath ? { host: socketPath } : {});

// Wrap instance around drizzle to get simple SQL queries and type safety
export const db = drizzle(client);
