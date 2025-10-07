import type { NodePlopAPI } from 'plop';
import { webComponentPlugin } from './web/component/web-component.plugin';
import { webModalPlugin } from './web/modal/web-modal.plugin';
import { webPagePlugin } from './web/page/web-page.plugin';

type Plugins = typeof PLUGINS;

const PLUGINS = {
  web: {
    component: webComponentPlugin,
    modal: webModalPlugin,
    page: webPagePlugin,
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
