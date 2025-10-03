import fs from 'node:fs/promises';
import type { AnyRecord } from '@bltx/core';
import { generateDrizzleJson, generateMigration } from 'drizzle-kit/api';
import type { Database } from '../db.types';

/**
 * setup a development db and sync the latest schema changes
 */
export const dbPush = async <Schema extends AnyRecord>(db: () => Database<Schema>, schema: Schema) => {
  let prev: ReturnType<typeof generateDrizzleJson>;
  let isFirst = false;

  if (await fs.exists('./data.db/schema.json')) {
    prev = await fs.readFile('./data.db/schema.json', 'utf-8').then(JSON.parse);
  } else {
    isFirst = true;
    prev = generateDrizzleJson({});
  }

  const next = generateDrizzleJson(schema);

  const statements = await generateMigration(prev, next);

  await db().transaction(async (tx) => {
    if (isFirst) {
      await tx.execute('CREATE EXTENSION vector');
      await tx.execute('CREATE EXTENSION earthdistance CASCADE');
      await tx.execute('CREATE EXTENSION fuzzystrmatch');
    }

    for (const sql of statements) {
      await tx.execute(sql);
    }
  });

  await fs.writeFile('./data.db/schema.json', JSON.stringify(next));
};
