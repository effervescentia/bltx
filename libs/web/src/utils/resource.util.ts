import type { Treaty } from '@elysiajs/eden';
import { ELYSIA_FORM_DATA } from 'elysia';
import { atom, useAtom } from 'jotai';
import { atomFamily, loadable } from 'jotai/utils';
import { useEffect } from 'react';

export type ResourceValue<T> =
  | { state: 'loading' }
  | { state: 'hasRedirect' }
  | { state: 'hasError'; error: unknown }
  | { state: 'hasData'; data: T extends { [ELYSIA_FORM_DATA]: infer Data } ? Data : T };

export interface ResourceOptions {
  onNotFound?: () => void;
}

export const resource = <T>(fetch: (resourceID: string) => Promise<Treaty.TreatyResponse<{ 200: T }>>) => {
  const family = atomFamily((resourceID: string) => loadable(atom(() => fetch(resourceID))));

  return (resourceID: string, options?: ResourceOptions): ResourceValue<T> => {
    const [value] = useAtom(family(resourceID));
    const notFound = value.state === 'hasData' && !value.data.data;

    useEffect(() => {
      if (notFound) {
        options?.onNotFound?.();
      }
    }, [notFound, options?.onNotFound]);

    if (notFound) {
      return { state: 'hasRedirect' } as const;
    }

    if (value.state === 'hasData') {
      if (value.data.error) {
        return { state: 'hasError', error: value.data.error } as const;
      }

      return { state: 'hasData', data: value.data.data } as const;
    }

    return value;
  };
};

export const resources = <T>(fetch: () => Promise<Treaty.TreatyResponse<{ 200: T }>>) => {
  const loadableAtom = loadable(atom(fetch));

  return () => {
    const [value] = useAtom(loadableAtom);

    if (value.state === 'hasData') {
      if (value.data.error) {
        return { state: 'hasError', error: value.data.error } as const;
      }

      return { state: 'hasData', data: value.data.data } as const;
    }

    return value;
  };
};
