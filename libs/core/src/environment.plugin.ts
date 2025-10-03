import Elysia, { type Static, type TSchema } from 'elysia';
import envSchema from 'env-schema';

export const createEnvironmentPlugin = <Schema extends TSchema>(schema: Schema) =>
  new Elysia({ name: 'plugin.environment' }).use((app) => {
    const env = envSchema<Static<Schema>>({
      schema,
      dotenv: import.meta.env.NODE_ENV === 'development',
    });

    return app.decorate({ env });
  });
