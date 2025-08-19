import Elysia from 'elysia';
import envSchema from 'env-schema';

// biome-ignore lint/suspicious/noExplicitAny: needed for generic type
export const createEnvironmentPlugin = <Schema extends Record<string, any>>(schema: Schema) =>
  new Elysia({ name: 'plugin.environment' }).use((app) => {
    const env = envSchema<Schema>({
      schema,
      dotenv: import.meta.env.NODE_ENV === 'development',
    });

    return app.decorate({ env });
  });
