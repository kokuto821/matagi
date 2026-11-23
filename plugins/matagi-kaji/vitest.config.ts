import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["skills/*/scripts/__tests__/**/*.test.ts"],
  },
});
