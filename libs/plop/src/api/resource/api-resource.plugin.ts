import path from 'node:path';

import type { NodePlopAPI } from 'plop';

export const apiResourcePlugin = (plop: NodePlopAPI) => {
  plop.setGenerator('api:resource', {
    description: 'API resource boilerplate',
    prompts: async (inquirer) => {
      const data = await inquirer.prompt<{ name: string; withCRUD: boolean; withService: boolean }>([
        {
          type: 'input',
          name: 'name',
          message: 'resource name',
        },
        {
          type: 'confirm',
          name: 'withCRUD',
          message: 'include CRUD boilerplate',
          default: false,
        },
        {
          type: 'confirm',
          name: 'withService',
          message: 'include service',
          default: false,
          when: ({ withCRUD }) => !withCRUD,
        },
      ]);

      return { ...data, withService: data.withCRUD || data.withService };
    },
    actions: (data) =>
      [
        {
          type: 'add',
          path: 'apps/api/src/{{kebabCase name}}/{{kebabCase name}}.controller.ts',
          templateFile: path.join(__dirname, 'template/controller.hbs'),
        },
        {
          type: 'add',
          path: 'apps/api/src/{{kebabCase name}}/data/{{kebabCase name}}.db.ts',
          templateFile: path.join(__dirname, 'template/db.hbs'),
        },
        {
          type: 'add',
          path: 'apps/api/src/{{kebabCase name}}/data/{{kebabCase name}}.dto.ts',
          templateFile: path.join(__dirname, 'template/dto.hbs'),
        },
        data?.withService
          ? {
              type: 'add',
              path: 'apps/api/src/{{kebabCase name}}/{{kebabCase name}}.service.ts',
              templateFile: path.join(__dirname, 'template/service.hbs'),
            }
          : [],
        data?.withCRUD
          ? [
              {
                type: 'add',
                path: 'apps/api/src/{{kebabCase name}}/data/create-{{kebabCase name}}.req.ts',
                templateFile: path.join(__dirname, 'template/create-request.hbs'),
              },
              {
                type: 'add',
                path: 'apps/api/src/{{kebabCase name}}/data/patch-{{kebabCase name}}.req.ts',
                templateFile: path.join(__dirname, 'template/patch-request.hbs'),
              },
            ]
          : [],
        {
          type: 'modify',
          path: 'apps/api/src/db/db.schema.ts',
          pattern: /^(export {};\n)?/,
          template: "export * from '@api/{{kebabCase name}}/data/{{kebabCase name}}.db';\n",
        },
        {
          type: 'modify',
          path: 'apps/api/src/app/app.interface.ts',
          pattern: /^(export {};\n)?/,
          template: "export type { {{pascalCase name}} } from '@api/{{kebabCase name}}/data/{{kebabCase name}}.dto';\n",
        },
        {
          type: 'modify',
          path: 'apps/api/src/app/app.module.ts',
          pattern: /^/,
          template:
            "import { {{pascalCase name}}Controller } from '@api/{{kebabCase name}}/{{kebabCase name}}.controller';\n",
        },
        {
          type: 'append',
          path: 'apps/api/src/app/app.module.ts',
          pattern: /(?=;\s*$)/,
          template: '  .use({{pascalCase name}}Controller)',
        },
      ].flat(),
  });
};
