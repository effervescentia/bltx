import type { AnyRecord } from '@bltx/core';
import { PGlite, type PGliteOptions } from '@electric-sql/pglite';
import { cube } from '@electric-sql/pglite/contrib/cube';
import { earthdistance } from '@electric-sql/pglite/contrib/earthdistance';
import { fuzzystrmatch } from '@electric-sql/pglite/contrib/fuzzystrmatch';
import { vector } from '@electric-sql/pglite/vector';
import type { SQL } from 'bun';
import { drizzle as drizzleBunSQL } from 'drizzle-orm/bun-sql';
import { drizzle as drizzlePGlite } from 'drizzle-orm/pglite';
import Elysia, { type SingletonBase } from 'elysia';

import { match } from 'ts-pattern';
import { DATABASE_PLUGIN } from './db.const';
import type { DatabaseLike } from './db.types';

type EnvironmentPluginInstance<Env> = Elysia<
  any,
  SingletonBase & { decorator: { env: () => Env } },
  any,
  any,
  any,
  any,
  any
>;

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
  new Elysia({ name: DATABASE_PLUGIN }).use(options.env).use((app) => {
    if (import.meta.env.NODE_ENV === 'test') {
      return app.decorate({ db: () => null! as DatabaseLike<any> });
    }

    const db = match(options)
      .with({ type: 'bun-sql' }, ({ schema, factory }) =>
        drizzleBunSQL({ schema, client: factory(app.decorator.env()) }),
      )
      .with({ type: 'pglite' }, ({ schema, factory }) =>
        drizzlePGlite({ schema, client: factory(app.decorator.env()) }),
      )
      .exhaustive();

    return app.decorate({ db: () => db });
  });
