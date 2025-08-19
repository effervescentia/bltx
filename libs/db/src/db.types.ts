/** biome-ignore-all lint/suspicious/noExplicitAny: needed for generic type */
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type {
  AnyPgColumn,
  PgQueryResultHKT,
  PgTableWithColumns,
  PgTransaction,
  SubqueryWithSelection,
  TableConfig,
} from 'drizzle-orm/pg-core';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import type { Merge } from 'type-fest';

export type Database<Schema extends Record<string, any>> = PgliteDatabase<Schema> | Transaction<Schema>;

export type AnyDatabase = Database<any>;

export type Transaction<Schema extends Record<string, any>> = PgTransaction<
  PgQueryResultHKT,
  Schema,
  ExtractTablesWithRelations<Schema>
>;

export type AnyTransaction = Transaction<any>;

export type Column<Type> = AnyPgColumn<{ data: Type }>;

export type AnyColumn = Column<any>;

export type Table<Columns extends Record<string, any>> = PgTableWithColumns<
  Merge<TableConfig, { columns: { [K in keyof Columns]: Column<Columns[K]> } }>
>;

export type AnyTable = Table<any>;

export type SubQuery<Columns extends Record<string, any>> = SubqueryWithSelection<Columns, any>;

export type AnySubQuery = SubQuery<any>;
