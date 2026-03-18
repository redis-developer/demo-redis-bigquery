import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environmentMatchGlobs: [["**/client/**/*.test.jsx", "jsdom"]],
    setupFiles: ["./vitest.setup.js"],
  },
});
