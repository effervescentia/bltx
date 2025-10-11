import { kebabCase } from 'change-case';
import fg from 'fast-glob';
import type { ListQuestion } from 'inquirer';
import { API_SOURCE_DIRECTORY } from './constants';

export const getModulePrompt = async (
  options: Pick<Partial<ListQuestion>, 'default' | 'message'>,
): Promise<ListQuestion<{ module: string }>> => {
  const modules = await fg.glob('*', { onlyDirectories: true, cwd: API_SOURCE_DIRECTORY });
  const defaultModule = options.default && kebabCase(options.default);

  return {
    type: 'list',
    name: 'module',
    message: options.message ?? 'module name',
    default: defaultModule,
    choices: Array.from(new Set([defaultModule ?? [], modules].flat())),
  };
};

export const getControllerPrompt = async (
  options: Pick<Partial<ListQuestion>, 'message'>,
): Promise<ListQuestion<{ controller: string }>> => {
  const controllers = await fg.glob('**/*.controller.ts', { cwd: API_SOURCE_DIRECTORY });

  return {
    type: 'list',
    name: 'controller',
    message: options.message ?? 'target controller',
    choices: controllers,
  };
};
