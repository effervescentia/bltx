import Elysia, { type Static, type TSchema } from 'elysia';
import { TypeCompiler } from 'elysia/type-system';
import envSchema from 'env-schema';
import { ENVIRONMENT_PLUGIN } from '../core.const';

export const createEnvironmentPlugin = <Schema extends TSchema>(schema: Schema) =>
  new Elysia({ name: ENVIRONMENT_PLUGIN }).use((app) => {
    if (import.meta.env.NODE_ENV === 'test') {
      return app.decorate({
        env: (): Static<Schema> => {
          throw new Error('environment plugin should not be used in a test environment');
        },
      });
    }

    const env = envSchema<Static<Schema>>({
      schema,
      dotenv: import.meta.env.NODE_ENV === 'development',
    });

    const decoded = TypeCompiler.Compile(schema).Decode(env);

    return app.decorate({ env: () => decoded });
  });
