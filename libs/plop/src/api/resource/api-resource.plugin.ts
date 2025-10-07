import path from 'node:path';

import type { NodePlopAPI } from 'plop';

export const apiResourcePlugin = (plop: NodePlopAPI) => {
  plop.setGenerator('api:resource', {
    description: 'api resource boilerplate',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'resource name',
      },
    ],
    actions: [
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
        template: "export type \{ {{pascalCase name}} } from '@api/{{kebabCase name}}/data/{{kebabCase name}}.dto';\n",
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
    ],
  });
};
