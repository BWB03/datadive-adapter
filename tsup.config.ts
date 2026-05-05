import { defineConfig } from "tsup";

export default defineConfig([
  // MCP server binary (with shebang)
  {
    entry: { index: "src/index.ts" },
    format: "esm",
    target: "node18",
    dts: true,
    clean: true,
    sourcemap: true,
    banner: { js: "#!/usr/bin/env node" },
  },
  // Library exports (no shebang)
  {
    entry: {
      openclaw: "src/openclaw.ts",
      "adapter/client": "src/adapter/client.ts",
      "adapter/endpoints": "src/adapter/endpoints.ts",
      "adapter/transformer": "src/adapter/transformer.ts",
      "schema/universal": "src/schema/universal.ts",
      constants: "src/constants.ts",
    },
    format: "esm",
    target: "node18",
    dts: true,
    sourcemap: true,
  },
]);
