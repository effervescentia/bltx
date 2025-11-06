import type { Treaty } from '@elysiajs/eden';
import { atom, useAtom } from 'jotai';
import { atomFamily, atomWithRefresh, loadable } from 'jotai/utils';
import { useEffect } from 'react';
import { useConst } from '../hooks/use-const.hook';

export type ResourceValue<T> =
  | { state: 'loading' }
  | { state: 'notFound' }
  | { state: 'hasError'; error: unknown }
  | { state: 'hasData'; data: Extract<Treaty.TreatyResponse<{ 200: T }>, { error: null }>['data'] };

export interface ResourceOptions {
  onNotFound?: () => void;
}

export const resource = <T>(fetch: (resourceID: string) => Promise<Treaty.TreatyResponse<{ 200: T }>>) => {
  const family = atomFamily((resourceID: string) => loadable(atom(() => fetch(resourceID))));

  return (resourceID: string, options?: ResourceOptions): ResourceValue<T> & { refresh: () => void } => {
    const refreshAtom = useConst(() => atomWithRefresh((get) => get(family(resourceID))));
    const [value, refresh] = useAtom(refreshAtom);
    const notFound = value.state === 'hasData' && !value.data.data;

    useEffect(() => {
      if (notFound) {
        options?.onNotFound?.();
      }
    }, [notFound, options?.onNotFound]);

    if (notFound) {
      return { state: 'notFound', refresh } as const;
    }

    if (value.state === 'hasData') {
      if (value.data.error) {
        return { state: 'hasError', error: value.data.error, refresh } as const;
      }

      return { state: 'hasData', data: value.data.data, refresh } as const;
    }

    return { ...value, refresh };
  };
};

export const resources = <T>(fetch: () => Promise<Treaty.TreatyResponse<{ 200: T }>>) => {
  const loadableAtom = loadable(atom(fetch));

  return (): ResourceValue<T> & { refresh: () => void } => {
    const refreshAtom = useConst(() => atomWithRefresh((get) => get(loadableAtom)));
    const [value, refresh] = useAtom(refreshAtom);

    if (value.state === 'hasData') {
      if (value.data.error) {
        return { state: 'hasError', error: value.data.error, refresh } as const;
      }

      return { state: 'hasData', data: value.data.data, refresh } as const;
    }

    return { ...value, refresh };
  };
};
