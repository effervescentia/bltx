import path from 'node:path';

import type { NodePlopAPI } from 'plop';
import { ALLOW_REQUEST_METHODS, ALLOW_RESPONSE_METHODS, HTTP_METHODS, PARAM_REGEX } from '../../constants';
import { getControllerPrompt } from '../../prompts';

const STRING_TYPE = 't.String()';

export const apiEndpointPlugin = (plop: NodePlopAPI) => {
  plop.setGenerator('api:endpoint', {
    description: 'API endpoint boilerplate',
    prompts: async (inquirer) => {
      const data = await inquirer.prompt<{
        controller: string;
        method: string;
        path: string;
        withRequest?: boolean;
        requestName?: string;
        withResponse?: boolean;
        responseName?: string;
        withQuery: boolean;
      }>([
        await getControllerPrompt({ message: 'add endpoint to this controller' }),
        {
          type: 'list',
          name: 'method',
          message: 'http method',
          choices: HTTP_METHODS,
        },
        {
          type: 'input',
          name: 'path',
          message: 'endpoint path',
          default: '/',
        },
        {
          type: 'confirm',
          name: 'withRequest',
          message: 'include request DTO',
          default: false,
          when: ({ method }) => ALLOW_REQUEST_METHODS.includes(method),
        },
        {
          type: 'input',
          name: 'requestName',
          message: 'request DTO name',
          when: ({ withRequest }) => withRequest,
        },
        {
          type: 'confirm',
          name: 'withResponse',
          message: 'include response DTO',
          default: false,
          when: ({ method }) => ALLOW_RESPONSE_METHODS.includes(method),
        },
        {
          type: 'input',
          name: 'responseName',
          message: 'response DTO name',
          when: ({ withResponse }) => withResponse,
        },
        {
          type: 'confirm',
          name: 'withQuery',
          message: 'include query DTO',
          default: false,
        },
      ]);

      // split around route parameters like `:foo_id` or `:bar_id?`
      const parts = data.path.split(PARAM_REGEX);

      const paramsSchema = parts
        .flatMap((part) => {
          if (part.startsWith(':')) {
            const key = part.replaceAll(/[:?]/g, '');
            const isOptional = part.endsWith('?');

            return `        ${key}: ${isOptional ? `t.Optional(${STRING_TYPE})` : STRING_TYPE},`;
          }

          return [];
        })
        .join('\n');

      const withParams = parts.length > 1;

      return {
        ...data,
        path: data.path.startsWith('/') ? data.path : `/${data.path}`,
        withDTOs: withParams || data.withQuery || data.withRequest || data.withResponse,
        withParams,
        paramsSchema,
      };
    },
    actions: (data) =>
      [
        {
          type: 'append',
          path: 'apps/api/src/{{controller}}',
          pattern: /(?=;\s*$)/,
          templateFile: path.join(__dirname, 'template/controller.hbs'),
        },
        data?.['withParams'] || data?.['withQuery']
          ? [
              {
                type: 'modify',
                path: 'apps/api/src/{{controller}}',
                transform: (template: string) => {
                  const lines = template.split('\n');

                  const importLineIndex = lines.findIndex((line) => line.startsWith('import Elysia'));
                  const importLine = lines[importLineIndex];

                  if (importLine === "import Elysia from 'elysia';") {
                    lines[importLineIndex] = "import Elysia, { t } from 'elysia';";
                  } else if (!importLine.match(/\bt\b/)) {
                    lines[importLineIndex] = `import Elysia, { t,${importLine.split('{')[1]}`;
                  }

                  return lines.join('\n');
                },
              },
            ]
          : [],
        data?.['withRequest']
          ? [
              {
                type: 'add',
                path: `apps/api/src/${path.dirname(data?.['controller'])}/data/{{kebabCase requestName}}.req.ts`,
                templateFile: path.join(__dirname, 'template/dto.hbs'),
                data: {
                  name: data?.['requestName'],
                  suffix: 'Request',
                },
              },
              {
                type: 'modify',
                path: 'apps/api/src/{{controller}}',
                pattern: /^/,
                template: "import { {{pascalCase requestName}}Request } from './data/{{kebabCase requestName}}.req';\n",
              },
            ]
          : [],
        data?.['withResponse']
          ? [
              {
                type: 'add',
                path: `apps/api/src/${path.dirname(data?.['controller'])}/data/{{kebabCase responseName}}.res.ts`,
                templateFile: path.join(__dirname, 'template/dto.hbs'),
                data: {
                  name: data?.['responseName'],
                  suffix: 'Response',
                },
              },
              {
                type: 'modify',
                path: 'apps/api/src/{{controller}}',
                pattern: /^/,
                template:
                  "import { {{pascalCase responseName}}Response } from './data/{{kebabCase responseName}}.res';\n",
              },
            ]
          : [],
      ].flat(),
  });
};
