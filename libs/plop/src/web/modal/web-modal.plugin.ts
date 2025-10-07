import path from 'node:path';

import type { NodePlopAPI } from 'plop';

export const webModalPlugin = (plop: NodePlopAPI) => {
  plop.setGenerator('web:modal', {
    description: 'web modal boilerplate',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'modal name',
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'apps/web/src/modals/{{kebabCase name}}/{{kebabCase name}}.modal.tsx',
        templateFile: path.join(__dirname, 'template/modal.hbs'),
      },
    ],
  });
};
