import { createContext, useMemo, useRef, useState } from 'react';

export interface DialogContext {
  open: (content: React.ReactNode) => void;
  close: () => void;
}

export const DialogContext = createContext<DialogContext>(null as never);

export const DialogProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [content, setContent] = useState<React.ReactNode | null>(null);
  const ref = useRef<HTMLDialogElement>(null);

  const api = useMemo<DialogContext>(
    () => ({
      open: (next) => {
        setContent(next);
        ref.current?.showModal();
      },

      close: () => {
        setContent(null);
        ref.current?.close();
      },
    }),
    [],
  );

  return (
    <DialogContext.Provider value={api}>
      <dialog ref={ref}>{content}</dialog>
      {children}
    </DialogContext.Provider>
  );
};
