import Elysia, { type Static, type TSchema } from 'elysia';
import { TypeCompiler } from 'elysia/type-system';
import envSchema from 'env-schema';

export const createEnvironmentPlugin = <Schema extends TSchema>(schema: Schema) =>
  new Elysia({ name: 'plugin.environment' }).use((app) => {
    const env = envSchema<Static<Schema>>({
      schema,
      dotenv: import.meta.env.NODE_ENV === 'development',
    });

    const decoded = TypeCompiler.Compile(schema).Decode(env);

    return app.decorate({ env: decoded });
  });
