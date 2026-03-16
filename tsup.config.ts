import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    openclaw: "src/openclaw.ts",
  },
  format: "esm",
  target: "node18",
  dts: true,
  clean: true,
  sourcemap: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
