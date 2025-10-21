import Elysia from 'elysia';
import logixlysia from 'logixlysia';
import { LOGGER_PLUGIN } from '../core.const';

export const LoggerPlugin = new Elysia({ name: LOGGER_PLUGIN }).use((app) => {
  if (import.meta.env.NODE_ENV !== 'development') return app;

  return app.use(
    logixlysia({
      config: {
        startupMessageFormat: 'simple',
      },
    }),
  );
});
