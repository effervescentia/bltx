export type Serialized<T> = T extends object
  ? {
      [K in keyof T]: NonNullable<T[K]> extends Date ? string | Exclude<T[K], Date> : Serialized<T[K]>;
    }
  : T;

export const serialize = <T>(value: T): Serialized<T> => {
  if (!value) return value as Serialized<T>;

  if (value instanceof Date) return value.toJSON() as Serialized<T>;

  if (Array.isArray(value)) {
    return value.map((item) => serialize(item)) as Serialized<T>;
  }

  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, value]) => [key, serialize(value)])) as Serialized<T>;
  }

  return value as Serialized<T>;
};
