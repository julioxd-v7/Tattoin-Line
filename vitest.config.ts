import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // 'server-only' quebra fora do Next; nos testes vira um módulo vazio (o app continua protegido)
      'server-only': path.resolve(__dirname, 'tests/stubs/server-only.ts')
    }
  }
});
