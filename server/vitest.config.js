import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    restoreMocks: true,
    hookTimeout: 300000,
    testTimeout: 60000,
  },
});
