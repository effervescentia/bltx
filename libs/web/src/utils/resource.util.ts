import type { Treaty } from '@elysiajs/eden';
import type { WritableAtom } from 'jotai';
import { atom } from 'jotai';
import { atomFamily, atomWithRefresh, loadable } from 'jotai/utils';

export type ResourceValue<T> =
  | { state: 'loading' }
  | { state: 'notFound' }
  | { state: 'hasError'; error: unknown }
  | { state: 'hasData'; data: Extract<Treaty.TreatyResponse<{ 200: T }>, { error: null }>['data'] };

export interface ResourceOptions {
  onNotFound?: () => void;
}

export interface StaticResourceAtom<T> extends WritableAtom<ResourceValue<T>, [], void> {
  taint: () => void;
}

export const staticResource = <T>(fetch: () => Promise<Treaty.TreatyResponse<{ 200: T }>>): StaticResourceAtom<T> => {
  const load = loadable(atom(fetch));
  const refresh = atomWithRefresh((get) => get(load));

  let tainted = false;

  const derivedAtom = atom(
    (get): ResourceValue<T> => {
      const value = get(refresh);

      if (value.state === 'hasData') {
        if (value.data.error) {
          return { state: 'hasError', error: value.data.error } as const;
        }

        return { state: 'hasData', data: value.data.data } as const;
      }

      return value;
    },
    (_, set) => set(refresh),
  );

  derivedAtom.onMount = (refresh) => {
    if (tainted) {
      tainted = false;
      refresh();
    }
  };

  return Object.assign(derivedAtom, {
    taint: () => {
      tainted = true;
    },
  });
};

export const dynamicResource = <T>(fetch: (resourceID: string) => Promise<Treaty.TreatyResponse<{ 200: T }>>) => {
  const tainted = new Set<string>();

  return atomFamily((resourceID: string) => {
    const load = loadable(atom(() => fetch(resourceID)));
    const refresh = atomWithRefresh((get) => get(load));

    const derivedAtom = atom(
      (get): ResourceValue<T> => {
        const value = get(refresh);
        const notFound = value.state === 'hasData' && !value.data.data;

        if (notFound) {
          return { state: 'notFound' } as const;
        }

        if (value.state === 'hasData') {
          if (value.data.error) {
            return { state: 'hasError', error: value.data.error } as const;
          }

          return { state: 'hasData', data: value.data.data } as const;
        }

        return value;
      },
      (_, set) => set(refresh),
    );

    derivedAtom.onMount = (refresh) => {
      if (tainted.has(resourceID)) {
        tainted.delete(resourceID);
        refresh();
      }
    };

    return Object.assign(derivedAtom, {
      taint: () => {
        tainted.add(resourceID);
      },
    });
  });
};
