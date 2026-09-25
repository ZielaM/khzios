/**
 * In-process PostgreSQL for integration tests.
 *
 * PGlite is real PostgreSQL compiled to WebAssembly: the project's migrations
 * (triggers, tsvector columns, GIN indexes) run unchanged, and Prisma talks to
 * it over the regular wire protocol, so no Docker or external database is
 * needed locally or in CI.
 */

import fs from 'fs';
import path from 'path';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

const MIGRATIONS_DIR = path.join(process.cwd(), 'prisma', 'migrations');

export interface TestDatabase {
  prisma: PrismaClient;
  stop: () => Promise<void>;
}

export async function startTestDatabase(): Promise<TestDatabase> {
  const db = await PGlite.create();

  const migrations = fs
    .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  for (const migration of migrations) {
    await db.exec(
      fs.readFileSync(
        path.join(MIGRATIONS_DIR, migration, 'migration.sql'),
        'utf8'
      )
    );
  }

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
