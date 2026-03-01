import type { Components, Theme } from '@mui/material';

export const MuiButton: Components<Theme>['MuiButton'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: 8,
      boxShadow: 'none',
      '&:hover': {
        boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
      },
    }),
  },
  defaultProps: {
    disableElevation: true,
  },
};
