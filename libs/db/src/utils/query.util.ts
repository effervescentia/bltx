import { type SQL, sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { match, P } from 'ts-pattern';

export const coalesce = <T>(...items: Array<SQL<T> | SQL.Aliased<T>>) =>
  match(items)
    .with([], () => sql`null`)
    .with([P.select()], (item) => item)
    .otherwise(() => sql<T>`COALESCE ${items}`) as SQL<T>;

export const lower = (value: SQL<string> | SQL.Aliased<string> | AnyPgColumn) => sql<string>`lower(${value})`;
