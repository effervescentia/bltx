import path from 'node:path';

import { kebabCase } from 'change-case';
import fg from 'fast-glob';
import type { NodePlopAPI } from 'plop';
import { match } from 'ts-pattern';

enum DTOType {
  DTO = 'dto',
  REQUEST = 'request',
  RESPONSE = 'response',
}

export const apiDTOPlugin = (plop: NodePlopAPI) => {
  plop.setGenerator('api:dto', {
    description: 'DTO boilerplate',
    prompts: async (inquirer) => {
      const modules = await fg.glob('*', {
        onlyDirectories: true,
        cwd: 'apps/api/src',
      });

      const { name, type } = await inquirer.prompt<{ name: string; type: DTOType }>([
        {
          type: 'input',
          name: 'name',
          message: 'DTO name',
        },
        {
          type: 'list',
          name: 'type',
          message: 'DTO type',
          choices: Object.values(DTOType),
          default: DTOType.DTO,
        },
      ]);

      const moduleName = kebabCase(name);
      if (!modules.includes(moduleName)) {
        modules.push(moduleName);
      }

      const data = await inquirer.prompt<{
        module: string;
        export: boolean;
      }>(
        [
          {
            type: 'list',
            name: 'module',
            message: 'module name',
            default: name,
            choices: modules,
          },
          type === DTOType.DTO
            ? {
                type: 'confirm',
                name: 'export',
                message: 'export DTO type',
                default: false,
              }
            : [],
        ].flat(),
      );

      const { suffix, extension } = match(type)
        .with(DTOType.DTO, () => ({ suffix: 'DTO', extension: 'dto' }))
        .with(DTOType.REQUEST, () => ({ suffix: 'Request', extension: 'req' }))
        .with(DTOType.RESPONSE, () => ({ suffix: 'Response', extension: 'res' }))
        .exhaustive();

      return { ...data, name, suffix, extension };
    },
    actions: (data) =>
      [
        {
          type: 'add',
          path: 'apps/api/src/{{module}}/data/{{kebabCase name}}.{{extension}}.ts',
          templateFile: path.join(__dirname, 'template/dto.hbs'),
        },
        data?.export
          ? {
              type: 'modify',
              path: 'apps/api/src/app/app.interface.ts',
              pattern: /^(export {};\n)?/,
              template:
                "export type \{ {{pascalCase name}} } from '@api/{{module}}/data/{{kebabCase name}}.{{extension}}';\n",
            }
          : [],
      ].flat(),
  });
};
