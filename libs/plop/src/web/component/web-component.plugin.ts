import path from 'node:path';

import type { NodePlopAPI } from 'plop';

export const webComponentPlugin = (plop: NodePlopAPI) => {
  plop.setGenerator('web:component', {
    description: 'web component boilerplate',
    prompts: async (inquirer) => {
      const { name, withStyles, withProps } = await inquirer.prompt<{
        name: string;
        withStyles: boolean;
        withProps: boolean;
      }>([
        {
          type: 'input',
          name: 'name',
          message: 'component name',
        },
        {
          type: 'confirm',
          name: 'withStyles',
          message: 'styled component',
        },
        {
          type: 'confirm',
          name: 'withProps',
          message: 'include props',
        },
      ]);

      if (!withProps) {
        return {
          name,
          withStyles,
          withProps,
        };
      }

      const { withChildren } = await inquirer.prompt<{ withChildren: boolean }>([
        {
          type: 'confirm',
          name: 'withChildren',
          message: 'add children props',
        },
      ]);

      return {
        name,
        withStyles,
        withProps,
        withChildren,
      };
    },
    actions: (data) =>
      [
        data?.withStyles
          ? {
              type: 'add',
              path: 'apps/web/src/components/{{kebabCase name}}/{{kebabCase name}}.css.ts',
              templateFile: path.join(__dirname, 'template/css.hbs'),
            }
          : [],
        {
          type: 'add',
          path: 'apps/web/src/components/{{kebabCase name}}/{{kebabCase name}}.component.tsx',
          templateFile: path.join(__dirname, 'template/component.hbs'),
        },
      ].flat(),
  });
};
