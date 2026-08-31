import { Buffer } from "node:buffer";

import esbuild from "esbuild";

const testEntries = [
  "tests/action-policy.test.ts",
  "tests/operating.test.ts",
  "tests/navigation.test.ts",
  "tests/entity-navigator.test.ts",
  "tests/ui-contract.test.ts",
  "tests/web-viewer.test.ts",
  "tests/style-contract.test.ts",
  "tests/process-env.test.ts"
];

for (const entryPoint of testEntries) {
  const result = await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node20",
    write: false,
    logLevel: "silent"
  });

  const output = result.outputFiles[0];
  if (!output) throw new Error(`The ${entryPoint} bundle was not produced.`);

  const source = Buffer.from(output.contents).toString("base64");
  await import(`data:text/javascript;base64,${source}`);
}
