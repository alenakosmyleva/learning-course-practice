import type { Components, Theme } from '@mui/material';

export const MuiCard: Components<Theme>['MuiCard'] = {
  styleOverrides: {
    root: {
      borderRadius: 12,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
    },
  },
};
