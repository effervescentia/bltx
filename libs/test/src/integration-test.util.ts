import { afterAll, beforeAll } from 'bun:test';
import fs from 'node:fs/promises';
import type { AnyRecord } from '@bltx/core';
import { TestEnvironmentPluginFactory } from '@bltx/core/test';
import { TestDatabasePluginFactory } from '@bltx/db/test';
import type { PGlite } from '@electric-sql/pglite';
import { sql } from 'drizzle-orm';
import Elysia, { type AnyElysia } from 'elysia';

export interface IntegrationTestOptions {
  /** truncate tables in between tests */
  autoClean?: boolean;
}

export const integrationTestFactory = <Schema extends AnyRecord, Env extends AnyRecord = never>(
  schema: Schema,
  env?: Env,
) => {
  const TestDatabasePlugin = TestDatabasePluginFactory(schema);

  return (controller: AnyElysia, envOverrides?: Partial<Env>) => {
    const dbPlugin = TestDatabasePlugin();
    const envPlugin = TestEnvironmentPluginFactory({ ...env, ...envOverrides });
    let client: PGlite;
    let app: AnyElysia;

    const truncate = async () => {
      await dbPlugin.decorator.db().transaction(async (tx) => {
        for (const table of Object.values(tx._.schema ?? {})) {
          await tx.execute(sql`TRUNCATE TABLE ${sql.identifier((table as { dbName: string }).dbName)} CASCADE`);
        }
      });
    };

    // TODO: update this once bun fixes this issue
    // https://github.com/oven-sh/bun/issues/23133

    beforeAll(
      null,
      async () => {
        app = new Elysia().use(dbPlugin).use(envPlugin).use(controller);
        await app.modules;
        client = dbPlugin.decorator.db().$client;
      },
      // @ts-ignore
      10_000,
    );

    afterAll(
      null,
      async () => {
        if (!client) return;

        await client.close();
        if (client.dataDir) {
          await fs.rm(client.dataDir, { recursive: true, force: true });
        }
      },
      // @ts-ignore
      10_000,
    );

    return {
      app: () => app,
      db: dbPlugin.decorator.db,
      env: envPlugin.decorator.env,
      truncate,
    };
  };
};
