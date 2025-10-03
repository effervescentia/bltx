import type { AnyRecord } from '@bltx/core';
import { PGlite, type PGliteOptions } from '@electric-sql/pglite';
import { cube } from '@electric-sql/pglite/contrib/cube';
import { earthdistance } from '@electric-sql/pglite/contrib/earthdistance';
import { fuzzystrmatch } from '@electric-sql/pglite/contrib/fuzzystrmatch';
import { vector } from '@electric-sql/pglite/vector';
import { drizzle } from 'drizzle-orm/pglite';
import Elysia from 'elysia';

export const createDatabaseClient = (options?: PGliteOptions) =>
  new PGlite({
    extensions: { vector, cube, earthdistance, fuzzystrmatch },
    ...options,
  });

export const createDatabasePlugin = <Schema extends AnyRecord>(schema: Schema) =>
  new Elysia({ name: 'plugin.database' }).use((app) => {
    const client = createDatabaseClient({ dataDir: './data.db' });
    const db = drizzle({ client, schema });

    return app.decorate({ db: () => db });
  });
