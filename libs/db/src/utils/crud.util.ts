import type { AnyRecord } from '@bltx/core';
import type { InferInsertModel, InferSelectModel, SQL } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import type { DatabaseLike } from '../db.types';

export const insertOne = async <Schema extends AnyRecord, Table extends PgTable>(
  db: DatabaseLike<Schema>,
  table: Table,
  values: InferInsertModel<Table>,
) => {
  const results = await db.insert(table).values(values).returning();
  return results[0] as InferSelectModel<Table>;
};

export const updateOne = async <Schema extends AnyRecord, Table extends PgTable>(
  db: DatabaseLike<Schema>,
  table: Table,
  where: SQL,
  values: Partial<InferInsertModel<Table>>,
) => {
  const results = (await db.update(table).set(values).where(where).returning()) as InferSelectModel<Table>[];
  if (!results.length) throw new Error(`Failed to update row from ${table._.name} table`);
  return results[0] as InferSelectModel<Table>;
};
