import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// Конфиг ТОЛЬКО для unit-тестов чистых функций — без живого Twenty-сервера
// и без globalSetup (app install/uninstall). Интеграционные тесты
// (*.integration-test.ts, требуют сервер на localhost:2020) — в vitest.config.ts.
//
// Запуск: npx vitest run -c vitest.unit.config.ts
export default defineConfig({
  plugins: [
    tsconfigPaths({
      projects: ['tsconfig.spec.json'],
      ignoreConfigErrors: true,
    }),
  ],
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
  },
});
