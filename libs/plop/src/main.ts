import type { NodePlopAPI } from 'plop';
import { webComponentPlugin } from './web/component/web-component.plugin';

type Plugins = typeof PLUGINS;

const PLUGINS = {
  web: {
    component: webComponentPlugin,
  },
};

type PluginOptions = {
  [K in keyof Plugins]?: {
    [L in keyof Plugins[K]]?: boolean;
  };
};

export const usePlugins = (plop: NodePlopAPI, options: PluginOptions = {}) => {
  for (const [groupKey, group] of Object.entries(PLUGINS)) {
    for (const [key, plugin] of Object.entries(group)) {
      const isEnabled = options[groupKey as keyof Plugins]?.[key as keyof Plugins[keyof Plugins]] ?? true;

      if (isEnabled) {
        plugin(plop);
      }
    }
  }
};
