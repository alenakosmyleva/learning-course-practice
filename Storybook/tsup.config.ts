import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/theme/index.ts'],
  format: ['esm'],
  dts: true,
  outDir: 'theme-build',
  clean: true,
  external: ['@mui/material', '@mui/material/styles', '@emotion/react', '@emotion/styled'],
  outExtension: () => ({ js: '.js', dts: '.d.ts' }),
});
