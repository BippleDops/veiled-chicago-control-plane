import { readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";

const requiredAssets = ["manifest.json", "main.js", "styles.css"];
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const versions = JSON.parse(readFileSync("versions.json", "utf8"));
const errors = [];

function requireEqual(label, actual, expected) {
  if (actual !== expected) {
    errors.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

requireEqual("manifest.id", manifest.id, "veiled-chicago-control-plane");
requireEqual("package version", packageJson.version, manifest.version);
requireEqual("versions mapping", versions[manifest.version], manifest.minAppVersion);

if (!/^\d+\.\d+\.\d+$/.test(manifest.version ?? "")) {
  errors.push(`manifest.version is not an exact semantic version: ${JSON.stringify(manifest.version)}`);
}

for (const asset of requiredAssets) {
  try {
    if (statSync(asset).size === 0) errors.push(`${asset} is empty`);
  } catch {
    errors.push(`${asset} is missing`);
  }
}

const syntax = spawnSync(process.execPath, ["--check", "main.js"], { encoding: "utf8" });
if (syntax.status !== 0) {
  errors.push(`main.js syntax check failed: ${(syntax.stderr || syntax.stdout).trim()}`);
}

const privatePathPatterns = [
  /\/Users\/[^/\s]+\/Library\/Mobile Documents\/iCloud~md~obsidian\/Documents\/Veiled Chicago/,
  /[A-Za-z]:\\Users\\[^\\\s]+\\.*Veiled Chicago/
];
for (const file of ["README.md", "main.js", "styles.css", "manifest.json"]) {
  const contents = readFileSync(file, "utf8");
  for (const pattern of privatePathPatterns) {
    if (pattern.test(contents)) errors.push(`${file} contains private absolute path material`);
  }
}

if (errors.length > 0) {
  console.error("release-check FAIL");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`release-check PASS ${manifest.id}@${manifest.version}`);
console.log(`assets ${requiredAssets.join(", ")}`);
