import { sql } from 'drizzle-orm';
import { customType, pgEnum, timestamp, varchar } from 'drizzle-orm/pg-core';
import type { Static, TSchema } from 'elysia';
import { TypeCompiler } from 'elysia/type-system';

export const uuidV7 = (name: string) => varchar(name, { length: 36 });

export const id = (name: string) =>
  uuidV7(name)
    .$defaultFn(() => Bun.randomUUIDv7())
    .primaryKey();

export const createdTimestamp = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
};

export const timestamps = {
  ...createdTimestamp,
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdateFn(() => new Date())
    .notNull(),
};

export const typedJSONB =
  <Schema extends TSchema>(schema: Schema, { deserialize = true }: { deserialize?: boolean } = {}) =>
  (name: string) =>
    customType<{ data: Static<Schema>; driverData: Static<Schema> }>({
      dataType() {
        return 'jsonb';
      },
      ...(deserialize && {
        fromDriver(value: Static<Schema>) {
          const compiler = TypeCompiler.Compile(schema);

          if (!compiler.Check(value)) {
            throw new Error(`Failed to deserialize database column ${name} from value:\n${value}`);
          }

          return compiler.Encode(value);
        },
      }),
    })(name);

export const nativeEnum = <EnumPrimitive extends Record<string, string>>(name: string, primitive: EnumPrimitive) =>
  pgEnum(
    name,
    Object.values(primitive) as [EnumPrimitive[keyof EnumPrimitive], ...EnumPrimitive[keyof EnumPrimitive][]],
  );

export const tsVector = customType({
  dataType() {
    return 'tsvector';
  },
});

export const geolocation = customType<{ data: [number, number]; driverData: string }>({
  dataType() {
    return 'cube';
  },
  fromDriver(value) {
    const [longitude, latitude] = value.slice(1, -1).split(', ');
    return [Number(longitude), Number(latitude)];
  },
  toDriver([longitude, latitude]) {
    return sql`cube(ARRAY[${longitude}::float8, ${latitude}::float8])`;
  },
});
