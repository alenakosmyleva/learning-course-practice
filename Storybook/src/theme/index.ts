import { createTheme, type Theme } from '@mui/material/styles';
import { lightPalette, darkPalette, palette } from './palette';
import { typography } from './typography';
import { components } from './components';

const sharedOptions = {
  typography,
  components,
  shape: {
    borderRadius: 8,
  },
} as const;

/**
 * Create an app theme for the given mode.
 *
 * @param mode - 'light' (default) or 'dark'
 * @returns A fully configured MUI Theme
 */
export function createAppTheme(mode: 'light' | 'dark' = 'light'): Theme {
  return createTheme({
    palette: mode === 'dark' ? darkPalette : lightPalette,
    ...sharedOptions,
  });
}

/**
 * Default light theme — backwards compatible with existing consumers.
 */
export const theme = createTheme({
  palette,
  ...sharedOptions,
});

// Re-export palette tokens for direct access
export { lightPalette, darkPalette, palette } from './palette';
