import type { PrimitiveAtom } from 'jotai';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { createContext, memo, type PropsWithChildren, useContext, useEffect, useMemo } from 'react';

interface TemplateContext {
  atoms: Record<string, PrimitiveAtom<React.ReactNode>>;
}

export const template = <Slot extends string>(
  slots: Slot[],
  Render: React.FC<React.PropsWithChildren<Record<Slot, React.FC>>>,
): React.FC<React.PropsWithChildren> & Record<Slot, React.FC<React.PropsWithChildren>> => {
  const context = createContext<TemplateContext>(null as never);

  const atoms = Object.fromEntries(slots.map((key) => [key, atom<React.ReactNode>(null)])) as unknown as Record<
    Slot,
    PrimitiveAtom<React.ReactNode>
  >;

  const components = slots.map((key) => {
    const slot: React.FC<{ children: React.ReactNode }> = memo(({ children }) => {
      const { atoms } = useContext(context);
      const updateSlot = useSetAtom(atoms[key]);

      useEffect(() => updateSlot(children), [updateSlot, children]);
      useEffect(() => () => updateSlot(null), [updateSlot]);

      return null;
    });

    const portal: React.FC = memo(() => {
      const { atoms } = useContext(context);

      const content = useAtomValue(atoms[key]);

      return content;
    });

    return {
      key,
      slot,
      portal,
    };
  });

  return Object.assign(
    (props: PropsWithChildren) => {
      const api = useMemo<TemplateContext>(() => ({ atoms }), []);

      return (
        <context.Provider value={api}>
          <Render
            {...props}
            {...(Object.fromEntries(components.map(({ key, portal }) => [key, portal])) as Record<Slot, React.FC>)}
          />
        </context.Provider>
      );
    },
    Object.fromEntries(components.map(({ key, slot }) => [key, slot])) as Record<
      Slot,
      React.FC<React.PropsWithChildren>
    >,
  );
};
