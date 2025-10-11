import path from 'node:path';

import type { NodePlopAPI } from 'plop';
import { getControllerPrompt } from '../../prompts';

export const apiServicePlugin = (plop: NodePlopAPI) => {
  plop.setGenerator('api:service', {
    description: 'service boilerplate',
    prompts: async (inquirer) => {
      const { name, withDatabase } = await inquirer.prompt<{ name: string; withDatabase: boolean }>([
        {
          type: 'input',
          name: 'name',
          message: 'service name',
        },
        {
          type: 'confirm',
          name: 'withDatabase',
          message: 'inject database',
        },
      ]);

      const { controller } = await inquirer.prompt([
        await getControllerPrompt({ message: 'inject service into this controller' }),
      ]);

      const folder = path.dirname(controller);

      return { name, withDatabase, controller, folder };
    },
    actions: (data) => [
      {
        type: 'add',
        path: 'apps/api/src/{{folder}}/{{kebabCase name}}.service.ts',
        templateFile: path.join(__dirname, 'template/service.hbs'),
      },
      {
        type: 'modify',
        path: 'apps/api/src/{{controller}}',
        pattern: /^/,
        template: "import { {{pascalCase name}}Service } from './{{kebabCase name}}.service';\n",
      },
      {
        type: 'append',
        path: 'apps/api/src/{{controller}}',
        pattern: data?.withDatabase ? '.use(DatabasePlugin)' : /Elysia.+}\)/g,
        template: data?.withDatabase
          ? "  .derive({ as: 'scoped' }, ({ db }) => ({ {{camelCase name}}: new {{pascalCase name}}Service(db()) }))"
          : '  .decorate({ {{camelCase name}}: new {{pascalCase name}}Service() })',
      },
    ],
  });
};
