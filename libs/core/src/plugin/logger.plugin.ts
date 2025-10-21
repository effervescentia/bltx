import Elysia from 'elysia';
import logixlysia, { createLogger } from 'logixlysia';
import { LOGGER_PLUGIN } from '../core.const';

export const LoggerPlugin = new Elysia({ name: LOGGER_PLUGIN }).use((app) => {
  const log = createLogger();

  return app
    .use(
      logixlysia({
        config: {
          startupMessageFormat: 'simple',
        },
      }),
    )
    .decorate({ log });
});
