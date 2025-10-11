import fs from 'node:fs/promises';
import path from 'node:path';

import type Inquirer from 'inquirer';
import type { NodePlopAPI } from 'plop';
import { ALLOW_REQUEST_METHODS, ALLOW_RESPONSE_METHODS, API_SOURCE_DIRECTORY, HTTP_METHODS } from '../constants';
import { getControllerPrompt } from '../prompts';

const CONTROLLER_PATTERN =
  /export const (?<controllerName>\w+Controller) = new Elysia\((?:{\s*prefix: '(?<controllerPath>[^']*))?'/;
const ROUTE_PATTERN = RegExp(`\\.(?<method>${HTTP_METHODS.join('|')})\\(\\s*'(?<path>/[^']*)'`, 'g');
const TEST_PATTERN = /describe\('(?<method>[A-Z]+) (?<path>\/[^']*)'/g;

interface ControllerRoute {
  method: string;
  path: string;
  withRequest: boolean;
  withResponse: boolean;
}

const handleExistingTest = async (inquirer: typeof Inquirer, testFile: string, routes: ControllerRoute[]) => {
  const testSource = await fs.readFile(path.join(API_SOURCE_DIRECTORY, testFile), 'utf-8').catch(() => null);

  if (testSource) {
    const { addMissing } = await inquirer.prompt<{ addMissing: boolean }>([
      {
        type: 'confirm',
        name: 'addMissing',
        message: `file ${testFile} already exists, add missing tests?`,
        default: true,
      },
    ]);

    if (!addMissing) throw new Error('Skipped test generation');

    const tests = Array.from(testSource.matchAll(TEST_PATTERN)).map(
      ({ groups }) => groups as Pick<ControllerRoute, 'method' | 'path'>,
    );

    if (!tests.length) throw new Error('Skipping generation, no missing tests found');

    const filteredRoutes = routes.filter(
      (route) => !tests.some((test) => test.method.toLowerCase() === route.method && test.path === route.path),
    );

    return { operationType: 'merge', routes: filteredRoutes };
  }

  return { operationType: 'add', routes };
};

const normalizePath = (path: string) => (path === '/' ? '' : path);

export const testControllerPlugin = (plop: NodePlopAPI) => {
  plop.setGenerator('test:controller', {
    description: 'controller test boilerplate',
    prompts: async (inquirer) => {
      const { controller } = await inquirer.prompt([await getControllerPrompt({ message: 'test this controller' })]);

      const controllerSource = await fs.readFile(path.join(API_SOURCE_DIRECTORY, controller), 'utf-8');
      const controllerImport = path.basename(controller).slice(0, -path.extname(controller).length);

      const controllerMatch = controllerSource.match(CONTROLLER_PATTERN);
      if (!controllerMatch) throw new Error(`Failed to find an elysia controller in ${controller}`);

      const { controllerName, controllerPath } = controllerMatch.groups as {
        controllerName: string;
        controllerPath?: string;
      };
      const routeMatches = controllerSource.matchAll(ROUTE_PATTERN);

      const controllerTest = path.join(path.dirname(controller), `${controllerImport}.test.ts`);

      const controllerRoutes = Array.from(routeMatches).flatMap<ControllerRoute>(({ groups }) => {
        if (!groups) return [];
        const { method, path } = groups as Pick<ControllerRoute, 'method' | 'path'>;

        return groups
          ? {
              method,
              path: controllerPath ? `${normalizePath(controllerPath)}${normalizePath(path)}` || '/' : path,
              withRequest: ALLOW_REQUEST_METHODS.includes(method),
              withResponse: ALLOW_RESPONSE_METHODS.includes(method),
            }
          : [];
      });

      const { operationType, routes } = await handleExistingTest(inquirer, controllerTest, controllerRoutes);

      return {
        controllerName,
        controllerImport,
        controllerTest,
        operationType,
        routes,
      };
    },
    actions: (data) => [
      data?.operationType === 'merge'
        ? {
            type: 'modify',
            path: 'apps/api/src/{{controllerTest}}',
            pattern: /(?=}\);\s*$)/,
            templateFile: path.join(__dirname, 'template/test.hbs'),
            data: { routesOnly: true },
          }
        : {
            type: 'add',
            path: 'apps/api/src/{{controllerTest}}',
            templateFile: path.join(__dirname, 'template/test.hbs'),
            data: { routesOnly: false },
          },
    ],
  });
};
