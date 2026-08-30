import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const styles = readFileSync("styles.css", "utf8");

const supportBlocks = styles.match(/@supports \(\(backdrop-filter: blur\(1px\)\) or \(-webkit-backdrop-filter: blur\(1px\)\)\)/g) ?? [];
assert.equal(supportBlocks.length, 1, "glass enhancement must have one cascade owner");

const glassMarker = "/* Progressive glass enhancement follows every opaque surface baseline";
const glassIndex = styles.indexOf(glassMarker);
assert.ok(glassIndex > styles.lastIndexOf("@container vc-control-plane"), "glass layer must follow responsive surface baselines");
const reducedTransparencyIndex = styles.indexOf("@media (prefers-reduced-transparency: reduce)", glassIndex);
assert.ok(
  glassIndex < reducedTransparencyIndex,
  "reduced-transparency preference must override glass"
);
const printIndex = styles.lastIndexOf("@media print");
assert.ok(printIndex > glassIndex, "final print fallback must override glass");
assert.match(
  styles.slice(printIndex),
  /\.vc-control-route-main,[\s\S]*?\.vc-control-hero,[\s\S]*?background:\s*#ffffff;[\s\S]*?backdrop-filter:\s*none;/,
  "final print fallback must make legacy and application surfaces opaque"
);

const glassSurfaces = [
  ".vc-control-hero",
  ".vc-control-toolbar",
  ".vc-control-section",
  ".vc-control-router",
  ".vc-control-policy",
  ".vc-control-health",
  ".vc-control-transactions",
  ".vc-control-runs",
  ".vc-control-block",
  ".vc-ad-statblock",
  ".vc-control-app-header",
  ".vc-control-route-nav",
  ".vc-control-context",
  ".vc-control-bottom-nav",
  ".vc-control-more-panel",
  ".vc-control-favorites",
  ".vc-control-recents",
  ".vc-control-entity-toolbar"
];
const glassBlock = styles.slice(glassIndex, styles.indexOf("@media (pointer: coarse)", glassIndex));
const reducedBlock = styles.slice(
  reducedTransparencyIndex,
  styles.indexOf("@media (prefers-contrast: more)", reducedTransparencyIndex)
);
const forcedColorsIndex = styles.indexOf("@media (forced-colors: active)", reducedTransparencyIndex);
const forcedBlock = styles.slice(forcedColorsIndex, printIndex);
const printBlock = styles.slice(printIndex);
for (const selector of glassSurfaces) {
  assert.ok(glassBlock.includes(selector), `glass layer is missing ${selector}`);
  assert.ok(reducedBlock.includes(selector), `reduced-transparency fallback is missing ${selector}`);
  assert.ok(forcedBlock.includes(selector), `forced-colors fallback is missing ${selector}`);
  assert.ok(printBlock.includes(selector), `print fallback is missing ${selector}`);
}

assert.match(
  styles,
  /\.vc-control-skip-link\s*\{[^}]*inline-size:\s*1px;[^}]*block-size:\s*1px;[^}]*clip-path:\s*inset\(50%\);/s,
  "skip link must be visually hidden until focused"
);
assert.match(
  styles,
  /\.vc-control-skip-link:focus,[\s\S]*?\.vc-control-skip-link:focus-visible\s*\{[^}]*clip-path:\s*none;[^}]*border:\s*2px solid var\(--vccp-focus\);/,
  "focused skip link must become visible"
);

assert.match(
  styles,
  /\.vc-control-context-section dl\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);/s,
  "context definition list must stack metric wrappers"
);
assert.match(
  styles,
  /\.vc-control-context-section \.vc-control-metric\s*\{[^}]*grid-template-columns:\s*minmax\(5rem, auto\) minmax\(0, 1fr\);/s,
  "each live-truth metric must own its label/value grid"
);
assert.doesNotMatch(
  styles,
  /(?:^|\n)\.vc-control-metric\s*\{[^}]*display:\s*grid;/s,
  "metric grid layout must not alter hero telemetry"
);

console.log("style-contract-tests PASS skip link, metrics, glass cascade, and preferences");
