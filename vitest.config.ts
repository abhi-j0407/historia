import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

export default defineConfig({
  plugins: [WxtVitest()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/core/**/*.ts'],
      exclude: ['src/core/types.ts', '**/*.test.ts', '**/*.d.ts'],
      thresholds: {
        // T-004: per-file gates on the listed core modules.
        'src/core/filters.ts': { lines: 90, branches: 90, functions: 90, statements: 90 },
        'src/core/aggregate.ts': { lines: 90, branches: 90, functions: 90, statements: 90 },
        'src/core/intensity.ts': { lines: 90, branches: 90, functions: 90, statements: 90 },
        'src/core/dates.ts': { lines: 90, branches: 90, functions: 90, statements: 90 },
        'src/core/domain.ts': { lines: 90, branches: 90, functions: 90, statements: 90 },
      },
    },
  },
  resolve: {
    alias: { '@': new URL('./src', import.meta.url).pathname },
  },
});
