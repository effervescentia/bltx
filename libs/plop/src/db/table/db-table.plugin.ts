import path from 'node:path';

import { snakeCase } from 'change-case';
import fg from 'fast-glob';
import type { NodePlopAPI } from 'plop';
import { match } from 'ts-pattern';

enum IDColumnType {
  UUID = 'uuid',
  SERIAL = 'serial',
}

export const dbTablePlugin = (plop: NodePlopAPI) => {
  plop.setGenerator('db:table', {
    description: 'database table boilerplate',
    prompts: async (inquirer) => {
      const modules = await fg.glob('*', {
        onlyDirectories: true,
        cwd: 'apps/api/src',
      });

      const { name, withRelations, withDTO, withID, idColumnType, isCompositeID, withTimestamps } =
        await inquirer.prompt<{
          name: string;
          withRelations: boolean;
          withDTO: boolean;
          withTimestamps: boolean;
          withID: boolean;
          idColumnType?: IDColumnType;
          isCompositeID?: boolean;
        }>([
          {
            type: 'input',
            name: 'name',
            message: 'table name',
          },
          {
            type: 'confirm',
            name: 'withRelations',
            message: 'include relations',
          },
          {
            type: 'confirm',
            name: 'withDTO',
            message: 'include DTO',
          },
          {
            type: 'confirm',
            name: 'withTimestamps',
            message: 'add createdAt and updatedAt',
          },
          {
            type: 'confirm',
            name: 'withID',
            message: 'add ID column',
          },
          {
            type: 'list',
            name: 'idColumnType',
            message: 'ID column type',
            choices: Object.values(IDColumnType),
            when: (data) => data.withID,
          },
          {
            type: 'confirm',
            name: 'isCompositeID',
            message: 'is the ID a composite key?',
            default: false,
            when: (data) => data.withID,
          },
        ]);

      const idColumnNames = await match({ withID, isCompositeID })
        .with({ withID: false }, () => [])
        .with({ isCompositeID: false }, async () => {
          const { columnName } = await inquirer.prompt<{ columnName: string }>([
            {
              type: 'input',
              name: 'columnName',
              message: 'ID column name',
              default: 'id',
            },
          ]);

          return [columnName];
        })
        .with({ isCompositeID: true }, async () => {
          const { columnNames } = await inquirer.prompt<{ columnNames: string }>([
            {
              type: 'input',
              name: 'columnNames',
              message: 'comma-separated list of column names that make up the composite ID',
            },
          ]);

          return columnNames
            .split(',')
            .map((column) => column.trim())
            .filter(Boolean);
        })
        .otherwise(() => []);

      if (!modules.includes(name)) {
        modules.push(name);
      }

      const data = await inquirer.prompt<{ module: string }>([
        {
          type: 'list',
          name: 'module',
          message: 'module name',
          default: name,
          choices: modules,
        },
      ]);

      const columnTemplate = match({ idColumnType, isCompositeID })
        .with({ idColumnType: IDColumnType.UUID, isCompositeID: false }, () => (name: string) => `id('${name}')`)
        .with(
          { idColumnType: IDColumnType.UUID, isCompositeID: true },
          () => (name: string) => `uuidV7('${name}').notNull()`,
        )
        .with(
          { idColumnType: IDColumnType.SERIAL, isCompositeID: false },
          () => (name: string) => `serial('${name}').primaryKey()`,
        )
        .with(
          { idColumnType: IDColumnType.SERIAL, isCompositeID: true },
          () => (name: string) => `serial('${name}').notNull()`,
        )
        .otherwise(() => () => '');

      const dtoType = match(idColumnType)
        .with(IDColumnType.UUID, () => "t.String({ format: 'uuid' })")
        .with(IDColumnType.SERIAL, () => 't.Number()')
        .otherwise(() => '');

      const bltxImports = [
        match({ idColumnType, isCompositeID })
          .with({ idColumnType: IDColumnType.UUID, isCompositeID: false }, () => 'id')
          .with({ idColumnType: IDColumnType.UUID, isCompositeID: true }, () => 'uuidV7')
          .otherwise(() => []),
        withTimestamps ? 'timestamps' : [],
      ].flat();

      return {
        ...data,
        name,
        withRelations,
        withDTO,
        withID,
        idColumnNames,
        isCompositeID,
        withTimestamps,
        importSerialColumn: idColumnType === IDColumnType.SERIAL,
        idColumnsTemplate: idColumnNames
          .map((column) => `    ${column}: ${columnTemplate(snakeCase(column))},`)
          .join('\n'),
        idFieldsTemplate: idColumnNames.map((column) => `  ${column}: ${dtoType},`).join('\n'),
        indexTemplate: isCompositeID
          ? `(t) => [primaryKey({ columns: [${idColumnNames
              .map((column) => `t.${column}`)
              .join(', ')}] }), ${idColumnNames.map((column) => `index().on(t.${column})`).join(', ')}]`
          : '',
        bltxImportTemplate: bltxImports.length ? `import { ${bltxImports.join(', ')} } from '@bltx/db';` : '',
      };
    },
    actions: (data) =>
      [
        {
          type: 'add',
          path: 'apps/api/src/{{module}}/data/{{kebabCase name}}.db.ts',
          templateFile: path.join(__dirname, 'template/table.hbs'),
        },
        {
          type: 'modify',
          path: 'apps/api/src/db/db.schema.ts',
          pattern: /^(export {};\n)?/,
          template: "export * from '@api/{{module}}/data/{{kebabCase name}}.db';\n",
        },
        data?.withDTO
          ? [
              {
                type: 'add',
                path: 'apps/api/src/{{module}}/data/{{kebabCase name}}.dto.ts',
                templateFile: path.join(__dirname, 'template/dto.hbs'),
              },
              {
                type: 'modify',
                path: 'apps/api/src/app/app.interface.ts',
                pattern: /^(export {};\n)?/,
                template: "export type { {{pascalCase name}} } from '@api/{{module}}/data/{{kebabCase name}}.dto';\n",
              },
            ]
          : [],
      ].flat(),
  });
};
