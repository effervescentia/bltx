import type { AnyRecord } from '@bltx/core';
import type { PGlite } from '@electric-sql/pglite';
import { generateDrizzleJson, generateMigration } from 'drizzle-kit/api';
import { drizzle } from 'drizzle-orm/pglite';
import Elysia from 'elysia';
import fs from 'fs/promises';
import { createPGliteDatabaseClient } from '../db.plugin';
import type { DatabaseLike } from '../db.types';

const tempDir = () => `/tmp/bltx-db-seed-${Bun.randomUUIDv7()}.db`;

const dumpSeedData = async <Schema extends AnyRecord>(schema: Schema) => {
  const dbDir = tempDir();
  const client = createPGliteDatabaseClient({ dataDir: dbDir });

  const db = drizzle({ client, schema });

  const statements = await generateMigration(generateDrizzleJson({}), generateDrizzleJson(schema));

  await db.transaction(async (tx) => {
    await tx.execute('CREATE EXTENSION vector');
    await tx.execute('CREATE EXTENSION earthdistance CASCADE');
    await tx.execute('CREATE EXTENSION fuzzystrmatch');

    for (const sql of statements) {
      await tx.execute(sql);
    }
  });

  const data = await client.dumpDataDir();
  await client.close();

  await fs.rm(dbDir, { recursive: true, force: true });

  return data;
};

export const TestDatabasePluginFactory = <Schema extends AnyRecord>(schema: Schema) => {
  let seedData: File | Blob | null = null;

  const initDB = async () => {
    if (!seedData) {
      seedData = await dumpSeedData(schema);
    }

    const client = createPGliteDatabaseClient({
      dataDir: tempDir(),
      loadDataDir: seedData,
    });
    return drizzle({ client, schema });
  };

  return () => {
    let db: DatabaseLike<Schema> & { $client: PGlite };

    return new Elysia({ name: 'plugin.database' })
      .use((app) => app.decorate({ db: () => db }))
      .use(async (app) => {
        db = await initDB();

        return app;
      });
  };
};
