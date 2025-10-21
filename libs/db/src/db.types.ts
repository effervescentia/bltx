import type { AnyRecord } from '@bltx/core';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type {
  AnyPgColumn,
  PgDatabase,
  PgQueryResultHKT,
  PgTableWithColumns,
  PgTransaction,
  SubqueryWithSelection,
  TableConfig,
} from 'drizzle-orm/pg-core';
import type { Merge } from 'type-fest';

export type Database<Schema extends AnyRecord> = PgDatabase<any, Schema> | Transaction<Schema>;

export type AnyDatabase = Database<any>;

export type Transaction<Schema extends AnyRecord> = PgTransaction<
  PgQueryResultHKT,
  Schema,
  ExtractTablesWithRelations<Schema>
>;

export type AnyTransaction = Transaction<any>;

export type Column<Type> = AnyPgColumn<{ data: Type }>;

export type AnyColumn = Column<any>;

export type Table<Columns extends AnyRecord> = PgTableWithColumns<
  Merge<TableConfig, { columns: { [K in keyof Columns]: Column<Columns[K]> } }>
>;

export type AnyTable = Table<any>;

export type SubQuery<Columns extends AnyRecord> = SubqueryWithSelection<Columns, any>;

export type AnySubQuery = SubQuery<any>;
