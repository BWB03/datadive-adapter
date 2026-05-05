import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const buildDir = join(root, ".mcpb-build");
const releaseDir = join(root, "release");
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));

manifest.version = packageJson.version;

rmSync(buildDir, { recursive: true, force: true });
mkdirSync(buildDir, { recursive: true });
mkdirSync(releaseDir, { recursive: true });

writeFileSync(join(buildDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

const bundledPackageJson = {
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  type: packageJson.type,
  bin: packageJson.bin,
  engines: packageJson.engines,
  dependencies: packageJson.dependencies,
};

writeFileSync(join(buildDir, "package.json"), `${JSON.stringify(bundledPackageJson, null, 2)}\n`);

for (const path of ["package-lock.json", "LICENSE", "README.md"]) {
  cpSync(join(root, path), join(buildDir, path));
}

cpSync(join(root, "dist"), join(buildDir, "dist"), { recursive: true });

execFileSync("npm", ["ci", "--omit=dev"], {
  cwd: buildDir,
  stdio: "inherit",
});

console.log(`Prepared MCPB bundle directory: ${buildDir}`);
