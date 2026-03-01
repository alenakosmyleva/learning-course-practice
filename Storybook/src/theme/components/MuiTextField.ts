import type { Components, Theme } from '@mui/material';

export const MuiTextField: Components<Theme>['MuiTextField'] = {
  styleOverrides: {
    root: {
      '& .MuiOutlinedInput-root': {
        borderRadius: 8,
      },
    },
  },
  defaultProps: {
    variant: 'outlined',
  },
};
