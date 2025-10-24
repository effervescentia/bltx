import type { AnyRecord, createEnvironmentPlugin } from '@bltx/core';
import { PGlite, type PGliteOptions } from '@electric-sql/pglite';
import { cube } from '@electric-sql/pglite/contrib/cube';
import { earthdistance } from '@electric-sql/pglite/contrib/earthdistance';
import { fuzzystrmatch } from '@electric-sql/pglite/contrib/fuzzystrmatch';
import { vector } from '@electric-sql/pglite/vector';
import type { SQL } from 'bun';
import { drizzle as drizzleBunSQL } from 'drizzle-orm/bun-sql';
import { drizzle as drizzlePGlite } from 'drizzle-orm/pglite';
import Elysia, { type TSchema } from 'elysia';

import { match } from 'ts-pattern';
import { DATABASE_PLUGIN } from './db.const';
import type { DatabaseLike } from './db.types';

type EnvironmentPluginInstance<Env> = ReturnType<typeof createEnvironmentPlugin<TSchema & { static: Env }>>;

export type DatabaseOptions<Schema, Env> =
  | {
      type: 'bun-sql';
      schema: Schema;
      env: EnvironmentPluginInstance<Env>;
      factory: (env: Env) => SQL;
    }
  | {
      type: 'pglite';
      schema: Schema;
      env: EnvironmentPluginInstance<Env>;
      factory: (env: Env) => PGlite;
    };

export const createPGliteDatabaseClient = (options?: PGliteOptions) =>
  new PGlite({
    extensions: { vector, cube, earthdistance, fuzzystrmatch },
    ...options,
  });

export const createDatabasePlugin = <Schema extends AnyRecord, Env extends AnyRecord>(
  options: DatabaseOptions<Schema, Env>,
) =>
  new Elysia({ name: DATABASE_PLUGIN }).use((app) => {
    if (import.meta.env.NODE_ENV === 'test') {
      return app.decorate({
        db: (): DatabaseLike<Schema> => {
          throw new Error('database plugin should not be used in a test environment');
        },
      });
    }

    const env = options.env.decorator.env();

    const db = match(options)
      .with({ type: 'bun-sql' }, ({ schema, factory }) => drizzleBunSQL({ schema, client: factory(env) }))
      .with({ type: 'pglite' }, ({ schema, factory }) => drizzlePGlite({ schema, client: factory(env) }))
      .exhaustive();

    return app.decorate({ db: () => db });
  });
