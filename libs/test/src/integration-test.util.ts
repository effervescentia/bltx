import { afterAll, beforeAll } from 'bun:test';
import type { AnyRecord } from '@bltx/core';
import { TestDatabasePluginFactory } from '@bltx/db/test';
import { type ExtractTablesWithRelations, sql } from 'drizzle-orm';
import Elysia, { type AnyElysia } from 'elysia';
import fs from 'fs/promises';

export interface IntegrationTestOptions {
  /** truncate tables in between tests */
  autoClean?: boolean;
}

export const integrationTestFactory = <Schema extends AnyRecord>(schema: Schema) => {
  const TestDatabasePlugin = TestDatabasePluginFactory(schema);

  return (controller: AnyElysia) => {
    const dbPlugin = TestDatabasePlugin();
    let app: AnyElysia;

    const truncate = async () => {
      await dbPlugin.decorator.db().transaction(async (tx) => {
        for (const table of Object.values((tx._.schema as ExtractTablesWithRelations<AnyRecord>) ?? {})) {
          await tx.execute(sql`TRUNCATE TABLE ${sql.identifier(table.dbName)} CASCADE`);
        }
      });
    };

    beforeAll(async () => {
      app = new Elysia().use(() => dbPlugin).use(controller);
      await app.modules;
    });

    afterAll(async () => {
      const client = dbPlugin.decorator.db().$client;

      await client.close();
      if (client.dataDir) {
        await fs.rm(client.dataDir, { recursive: true, force: true });
      }
    });

    return {
      app: () => app,
      db: dbPlugin.decorator.db,
      truncate,
    };
  };
};
