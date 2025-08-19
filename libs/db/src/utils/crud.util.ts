/** biome-ignore-all lint/suspicious/noExplicitAny: needed for generic type */

import type { SQL } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import type { Database } from '../db.types';

export const insertOne = async <Schema extends Record<string, any>, Table extends PgTable>(
  db: Database<Schema>,
  table: Table,
  values: Table['$inferInsert'],
) => {
  const results = await db.insert(table).values(values).returning();
  return results[0] as Table['$inferSelect'];
};

export const updateOne = async <Schema extends Record<string, any>, Table extends PgTable>(
  db: Database<Schema>,
  table: Table,
  where: SQL,
  values: Partial<Table['$inferInsert']>,
) => {
  const results = (await db.update(table).set(values).where(where).returning()) as Table['$inferSelect'][];
  if (!results.length) throw new Error(`Failed to update row from ${table._.name} table`);
  return results[0];
};
