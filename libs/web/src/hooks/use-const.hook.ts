import { useRef } from 'react';

export const useConst = <T>(factory: () => T) => {
  const initializedRef = useRef(false);
  const valueRef = useRef<T>(undefined);

  if (!initializedRef.current) {
    initializedRef.current = true;
    valueRef.current = factory();
  }

  return valueRef.current as T;
};
