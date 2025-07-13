import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Include only unit and integration tests, exclude E2E tests
    include: [
      'tests/unit/**/*.{test,spec}.{js,ts}',
      'tests/integration/**/*.{test,spec}.{js,ts}'
    ],
    setupFiles: ['./tests/vitest.setup.ts'],
    // Exclude E2E tests, node_modules, and other files
    exclude: [
      'tests/e2e/**/*',
      'tests/manual/**/*',
      '**/node_modules/**',
      'src/**/node_modules/**',
      'src/backend/node_modules/**/*',
      'src/frontend/node_modules/**/*',
      'dist/**/*',
      'build/**/*',
      'playwright-report/**/*',
      'test-results/**/*'
    ],
    // Test environment
    environment: 'node',
    // Global setup
    globals: true,
    // Coverage settings (optional)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'tests/e2e/**/*',
        'tests/manual/**/*',
        '**/node_modules/**',
        'src/**/node_modules/**',
        'dist/**/*',
        'build/**/*'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
