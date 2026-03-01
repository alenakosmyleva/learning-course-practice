import type { PaletteOptions } from '@mui/material';

/**
 * Light mode palette — the default color scheme.
 * All color tokens are centralized here as the single source of truth
 * for future Figma sync.
 */
export const lightPalette: PaletteOptions = {
  mode: 'light',
  primary: {
    main: '#6366F1',
  },
  secondary: {
    main: '#EC4899',
  },
  background: {
    default: '#F8FAFC',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#1E293B',
    secondary: '#64748B',
  },
};

/**
 * Dark mode palette.
 * Primary and secondary stay the same for brand consistency;
 * background and text are adjusted for dark surfaces.
 */
export const darkPalette: PaletteOptions = {
  mode: 'dark',
  primary: {
    main: '#818CF8', // slightly lighter indigo for dark backgrounds
  },
  secondary: {
    main: '#F472B6', // slightly lighter pink for dark backgrounds
  },
  background: {
    default: '#0F172A',
    paper: '#1E293B',
  },
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
  },
};

/**
 * @deprecated Use `lightPalette` or `darkPalette` instead.
 * Kept for backwards compatibility — identical to `lightPalette`.
 */
export const palette: PaletteOptions = lightPalette;
