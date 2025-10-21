import path from 'node:path';

import type { NodePlopAPI } from 'plop';
import { match } from 'ts-pattern';
import { getModulePrompt } from '../../prompts';

enum DTOType {
  DTO = 'dto',
  REQUEST = 'request',
  RESPONSE = 'response',
}

export const apiDTOPlugin = (plop: NodePlopAPI) => {
  plop.setGenerator('api:dto', {
    description: 'DTO boilerplate',
    prompts: async (inquirer) => {
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

      const data = await inquirer.prompt<{
        module: string;
        export: boolean;
      }>(
        [
          await getModulePrompt({ default: name }),
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
        data?.['export']
          ? {
              type: 'modify',
              path: 'apps/api/src/app/app.interface.ts',
              pattern: /^(export {};\n)?/,
              template:
                "export type { {{pascalCase name}} } from '@api/{{module}}/data/{{kebabCase name}}.{{extension}}';\n",
            }
          : [],
      ].flat(),
  });
};
