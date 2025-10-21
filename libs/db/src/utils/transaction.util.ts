import type { AnyRecord } from '@bltx/core';
import { PgTransaction } from 'drizzle-orm/pg-core';
import type { Database, DatabaseLike, Transaction } from '../db.types';

export const transaction = <Schema extends AnyRecord>(db: DatabaseLike<Schema>): Database<Schema>['transaction'] => {
  if (db instanceof PgTransaction) return <R>(callback: (tx: Transaction<Schema>) => R) => callback(db);
  return db.transaction.bind(db);
};
