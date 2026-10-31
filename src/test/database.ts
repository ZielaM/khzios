/**
 * Database for integration tests.
 *
 * By default an in-process PostgreSQL: PGlite is real PostgreSQL compiled to
 * WebAssembly, so the project's migrations (triggers, tsvector columns, GIN
 * indexes) run unchanged, and Prisma talks to it over the regular wire
 * protocol, so no Docker or external database is needed locally or in CI.
 *
 * PGlite has no Hunspell dictionaries, so Polish and Ukrainian are searched
 * without stemming there. Set TEST_DATABASE_URL to a server built from
 * Dockerfile.db (any database on it; tests need to create databases) to run
 * the same tests with the dictionaries of production:
 *
 *   TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres pnpm vitest run integration
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

const MIGRATIONS_DIR = path.join(process.cwd(), 'prisma', 'migrations');

/** Set when the tests run against the database image, with its dictionaries */
export const serverDatabaseUrl = process.env.TEST_DATABASE_URL;

export interface TestDatabase {
  prisma: PrismaClient;
  stop: () => Promise<void>;
}

/** The SQL of every migration, in the order Prisma applies them */
function migrations(): string[] {
  return fs
    .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((name) =>
      fs.readFileSync(path.join(MIGRATIONS_DIR, name, 'migration.sql'), 'utf8')
    );
}

export async function startTestDatabase(): Promise<TestDatabase> {
  return serverDatabaseUrl
    ? startOnServer(serverDatabaseUrl)
    : startInProcess();
}

async function startInProcess(): Promise<TestDatabase> {
  const db = await PGlite.create();
  for (const sql of migrations()) await db.exec(sql);

  // Several test files may run in parallel workers
  const port = 40000 + Math.floor(Math.random() * 20000);
  const server = new PGLiteSocketServer({
    db,
    port,
    host: '127.0.0.1',
    maxConnections: 10,
  });
  await server.start();

  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`,
    }),
  });

  return {
    prisma,
    stop: async () => {
      await prisma.$disconnect();
      await server.stop();
      await db.close();
    },
  };
}

/** A fresh database on the server for each test file, dropped by stop() */
async function startOnServer(url: string): Promise<TestDatabase> {
  const name = `khzios_test_${Math.random().toString(36).slice(2, 10)}`;
  const admin = new pg.Client({ connectionString: url });
  await admin.connect();
  await admin.query(`CREATE DATABASE ${name}`);
  const drop = async () => {
    await admin.query(`DROP DATABASE ${name} WITH (FORCE)`);
    await admin.end();
  };

  const target = new URL(url);
  target.pathname = `/${name}`;
  const connectionString = target.toString();

  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    // Without parameters node-postgres sends each file as one simple query,
    // the way Prisma applies a migration
    for (const sql of migrations()) await client.query(sql);
  } catch (err) {
    await client.end();
    await drop();
    throw err;
  }
  await client.end();

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  return {
    prisma,
    stop: async () => {
      await prisma.$disconnect();
      await drop();
    },
  };
}
