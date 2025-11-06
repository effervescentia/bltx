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

export const resource = <T>(fetch: () => Promise<Treaty.TreatyResponse<{ 200: T }>>) => {
  const load = loadable(atom(fetch));
  const refreshAtom = atomWithRefresh((get) => get(load));

  let tainted = false;

  const derivedAtom = atom(
    (get): ResourceValue<T> => {
      const value = get(refreshAtom);

      if (value.state === 'hasData') {
        if (value.data.error) {
          return { state: 'hasError', error: value.data.error } as const;
        }

        return { state: 'hasData', data: value.data.data } as const;
      }

      return value;
    },
    (_, set) => set(refreshAtom),
  );

  derivedAtom.onMount = (refresh) => {
    if (tainted) {
      tainted = false;
      refresh();
    }
  };

  return {
    atom: derivedAtom,
    taint: () => {
      tainted = true;
    },
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
