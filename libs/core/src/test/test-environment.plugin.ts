import Elysia from 'elysia';
import { ENVIRONMENT_PLUGIN } from '../core.const';
import type { AnyRecord } from '../core.types';

export const TestEnvironmentPluginFactory = <Env extends AnyRecord>(env: Env) =>
  new Elysia({ name: ENVIRONMENT_PLUGIN }).use((app) => app.decorate({ env }));
