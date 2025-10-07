import { useContext } from 'react';
import { template } from '../../utils/template.util';
import { Box } from '../box/box.component';
import { DialogContext } from './dialog.context';

const CancelButton: React.FC = () => {
  const { close } = useContext(DialogContext);

  return (
    <button type="button" onClick={close}>
      Cancel
    </button>
  );
};

export const Dialog = template(['Body', 'Actions'], ({ children, Body, Actions }) => (
  <Box>
    <Box>
      <Body />
    </Box>
    {children}
    <Box>
      <CancelButton />
      <Actions />
    </Box>
  </Box>
));
