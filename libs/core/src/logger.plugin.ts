import Elysia from 'elysia';
import logixlysia, { createLogger } from 'logixlysia';

export const LoggerPlugin = new Elysia({ name: 'plugin.logger' }).use((app) => {
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
