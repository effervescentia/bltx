import path from 'node:path';

import type { NodePlopAPI } from 'plop';
import { PARAM_REGEX } from '../../constants';

export const webPagePlugin = (plop: NodePlopAPI) => {
  plop.setGenerator('web:page', {
    description: 'web page boilerplate',
    prompts: async (inquirer) => {
      const { name } = await inquirer.prompt<{ name: string }>([
        {
          type: 'input',
          name: 'name',
          message: 'page name',
        },
      ]);

      const { route } = await inquirer.prompt<{ route: string }>([
        {
          type: 'input',
          name: 'route',
          message: 'page route',
          default: `/${name}`,
        },
      ]);

      if (!route.includes(':')) return { name, route, withProps: false };

      // split around route parameters like `:foo_id` or `:bar_id?`
      const parts = route.split(PARAM_REGEX);

      const { schema, factory, attrs, props, typedef } = parts.reduce(
        (acc, part) => {
          if (part.startsWith(':')) {
            const key = part.replaceAll(/[:?]/g, '');
            const isOptional = part.endsWith('?');

            acc.schema += `\n      ${key}: param.path${isOptional ? '.optional' : ''}.string,`;
            acc.factory += `$\{p.${key}}`;
            acc.attrs += ` ${key}={params.${key}}`;
            acc.typedef += `\n  ${key}${isOptional ? '?' : ''}: string;`;
            acc.props.push(key);
          } else {
            acc.factory += part;
          }

          return acc;
        },
        {
          schema: '',
          factory: '',
          attrs: '',
          props: [] as string[],
          typedef: '',
        },
      );

      const routeTemplate = `\n  {{camelCase name}}: defineRoute(
    {${schema}\n    },
    (p) => \`${factory}\`,
  ),`;

      const renderTemplate = `    .with({ name: '{{camelCase name}}' }, ({ params }) => <{{pascalCase name}}${attrs} />)\n\n`;

      return {
        name,
        route,
        withProps: true,
        propsDestruct: `{ ${props.join(', ')} }`,
        propsInterface: `{${typedef}\n}`,
        routeTemplate,
        renderTemplate,
      };
    },
    actions: (data) => [
      {
        type: 'add',
        path: 'apps/web/src/pages/{{kebabCase name}}/{{kebabCase name}}.page.tsx',
        templateFile: path.join(__dirname, 'template/page.hbs'),
      },
      {
        type: 'append',
        path: 'apps/web/src/app/app.router.ts',
        pattern: /(?=}\);\s*$)/,
        template: data?.routeTemplate ?? `  {{camelCase name}}: defineRoute('{{route}}'),\n`,
      },
      {
        type: 'modify',
        path: 'apps/web/src/app/app.component.tsx',
        pattern: /^/,
        template: "import { {{pascalCase name}} } from '@web/pages/{{kebabCase name}}/{{kebabCase name}}.page';\n",
      },
      {
        type: 'append',
        path: 'apps/web/src/app/app.component.tsx',
        pattern: /(?=\.otherwise\()/,
        template:
          data?.renderTemplate ?? `    .with({ name: '{{camelCase name}}' }, () => <{{pascalCase name}} />)\n\n`,
      },
      {
        type: 'modify',
        path: 'apps/web/src/app/app.router.ts',
        transform: (text) => {
          const match = text.match(/(?<=import {)[^}]+(?=} from 'type-route';)/);
          if (match?.index === undefined) {
            console.error('failed to inject imports into app.router.ts');
            return text;
          }

          const imports = match[0];

          const isMultiline = imports.includes('\n');
          const requiredImports = ['defineRoute', data?.routeTemplate ? 'param' : []].flat();
          const missingImports = requiredImports.filter((name) => !imports.match(RegExp(`\\b${name}\\b`)));

          if (!missingImports.length) return text;

          let transformed = imports.trim();
          for (const name of missingImports) {
            if (isMultiline) {
              transformed = `\n${transformed},\n  ${name}\n`;
            } else {
              transformed = ` ${transformed}, ${name} `;
            }
          }

          return `${text.slice(0, match.index)}${transformed}${text.slice(match.index + imports.length)}`;
        },
      },
    ],
  });
};
