import { Buffer } from "node:buffer";

import esbuild from "esbuild";

const result = await esbuild.build({
  entryPoints: ["tests/operating.test.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  write: false,
  logLevel: "silent"
});

const output = result.outputFiles[0];
if (!output) throw new Error("The operating test bundle was not produced.");

const source = Buffer.from(output.contents).toString("base64");
await import(`data:text/javascript;base64,${source}`);
