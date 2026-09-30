import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["hooks/__tests__/**/*.test.ts", "adapters/**/__tests__/**/*.test.ts"],
  },
});
