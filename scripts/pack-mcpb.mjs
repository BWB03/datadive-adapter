import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const releaseDir = join(root, "release");
const outputPath = join(releaseDir, `${packageJson.name}-v${packageJson.version}.mcpb`);

mkdirSync(releaseDir, { recursive: true });

execFileSync("mcpb", ["pack", ".mcpb-build", outputPath], {
  cwd: root,
  stdio: "inherit",
});
