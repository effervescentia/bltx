import type { AnyRecord } from '@bltx/core';
import { PGlite, type PGliteOptions } from '@electric-sql/pglite';
import { cube } from '@electric-sql/pglite/contrib/cube';
import { earthdistance } from '@electric-sql/pglite/contrib/earthdistance';
import { fuzzystrmatch } from '@electric-sql/pglite/contrib/fuzzystrmatch';
import { vector } from '@electric-sql/pglite/vector';
import type { SQL } from 'bun';
import { drizzle as drizzleBunSQL } from 'drizzle-orm/bun-sql';
import { drizzle as drizzlePGlite } from 'drizzle-orm/pglite';
import Elysia from 'elysia';
import { match } from 'ts-pattern';

export type DatabaseOptions<Schema> =
  | {
      type: 'bun-sql';
      schema: Schema;
      client: SQL;
    }
  | {
      type: 'pglite';
      schema: Schema;
      client: PGlite;
    };

export const createPGliteDatabaseClient = (options?: PGliteOptions) =>
  new PGlite({
    extensions: { vector, cube, earthdistance, fuzzystrmatch },
    ...options,
  });

export const createDatabasePlugin = <Schema extends AnyRecord>(options: DatabaseOptions<Schema>) =>
  new Elysia({ name: 'plugin.database' }).use((app) => {
    const db = match(options)
      .with({ type: 'bun-sql' }, ({ schema, client }) => drizzleBunSQL({ schema, client }))
      .with({ type: 'pglite' }, ({ schema, client }) => drizzlePGlite({ schema, client }))
      .exhaustive();

    return app.decorate({ db: () => db });
  });
