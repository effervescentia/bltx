import type { Treaty } from '@elysiajs/eden';
import type { WritableAtom } from 'jotai';
import { atom } from 'jotai';
import { atomFamily, atomWithRefresh, loadable } from 'jotai/utils';

export type ResourceValue<T> =
  | { state: 'loading' }
  | { state: 'notFound' }
  | { state: 'hasError'; error: unknown }
  | { state: 'hasData'; data: Extract<Treaty.TreatyResponse<{ 200: T }>, { error: null }>['data'] };

export interface StaticResourceAtom<T> extends WritableAtom<ResourceValue<T>, [] | [T], void> {
  taint: () => void;
}

export interface DynamicResourceAtom<T> extends ReturnType<typeof atomFamily<string, StaticResourceAtom<T>>> {
  taint: (resourceID: string) => void;
}

export const resource = <T>(fetch: () => Promise<Treaty.TreatyResponse<{ 200: T }>>) => {
  const local = atom(null as ResourceValue<T> | null);
  const refresh = atomWithRefresh(() => fetch());
  const load = loadable(refresh);

  return atom<ResourceValue<T>, [T | undefined], void>(
    (get) => {
      const localValue = get(local);
      if (localValue) return localValue;

      const value = get(load);

      if (value.state === 'hasData') {
        if (value.data.error) {
          return { state: 'hasError', error: value.data.error } as const;
        }

        return { state: 'hasData', data: value.data.data } as const;
      }

      return value;
    },
    (_, set, value?) => {
      if (value === undefined) {
        set(local, null);
        set(refresh);
      } else {
        set(local, { state: 'hasData', data: value } as ResourceValue<T>);
      }
    },
  );
};

export const staticResource = <T>(fetch: () => Promise<Treaty.TreatyResponse<{ 200: T }>>): StaticResourceAtom<T> => {
  const resourceAtom = resource(fetch);

  let tainted = false;

  const derivedAtom = atom<ResourceValue<T>, [] | [T], void>(
    (get) => get(resourceAtom),
    (_, set, value?) => {
      tainted = false;

      set(resourceAtom, value);
    },
  );

  derivedAtom.onMount = (refresh) => {
    if (tainted) {
      refresh();
    }
  };

  return Object.assign(derivedAtom, {
    taint: () => {
      tainted = true;
    },
  });
};

export const dynamicResource = <T>(
  fetch: (resourceID: string) => Promise<Treaty.TreatyResponse<{ 200: T }>>,
): DynamicResourceAtom<T> => {
  const tainted = new Set<string>();

  const family = atomFamily((resourceID: string): StaticResourceAtom<T> => {
    const resourceAtom = resource(() => fetch(resourceID));

    const derivedAtom = atom<ResourceValue<T>, [] | [T], void>(
      (get) => {
        const value = get(resourceAtom);
        const notFound = value.state === 'hasData' && !value.data;

        if (notFound) {
          return { state: 'notFound' } as const;
        }

        return value;
      },
      (_, set, value?) => {
        tainted.delete(resourceID);

        set(resourceAtom, value);
      },
    );

    derivedAtom.onMount = (refresh) => {
      if (tainted.has(resourceID)) {
        refresh();
      }
    };

    return Object.assign(derivedAtom, {
      taint: () => {
        tainted.add(resourceID);
      },
    });
  });

  return Object.assign(family, {
    taint: (resourceID: string) => {
      tainted.add(resourceID);
    },
  });
};
