import { PgTransaction } from 'drizzle-orm/pg-core';
import type { Database, Transaction } from '../db.types';

// biome-ignore lint/suspicious/noExplicitAny: needed for generic type
export const transaction = <Schema extends Record<string, any>>(
  db: Database<Schema>,
): Database<Schema>['transaction'] => {
  if (db instanceof PgTransaction) return <R>(callback: (tx: Transaction<Schema>) => R) => callback(db);
  return db.transaction.bind(db);
};
