import { forwardRef } from 'react';

import { type Sprinkles, sprinkles } from './box.css';

export interface BoxProps extends React.PropsWithChildren<Sprinkles> {}

export const Box = forwardRef<HTMLDivElement, BoxProps>(({ children, ...props }, ref) => {
  const { className, style, otherProps } = sprinkles(props);

  return (
    <div ref={ref} className={className} style={style} {...otherProps}>
      {children}
    </div>
  );
});
