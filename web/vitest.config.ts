import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The same "@/…" imports as tsconfig.json, so tests can load pages and routes.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  // React's automatic JSX runtime, as Next.js compiles it, so tests can render components.
  esbuild: { jsx: "automatic" },
  // A template's app (content/templates/<slug>.app) has its own tests: Pinto Notes runs them
  // (scripts/template-apps.ts), not the site.
  test: { exclude: ["**/node_modules/**", "content/templates/*.app/**"] },
});
