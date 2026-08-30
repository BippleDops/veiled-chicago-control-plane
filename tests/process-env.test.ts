import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const mainSource = readFileSync("src/main.ts", "utf8");
const companionSource = readFileSync("companion/vcg_control.py", "utf8");

assert.match(
  mainSource,
  /env:\s*\{\s*\.\.\.process\.env,\s*PYTHONDONTWRITEBYTECODE:\s*"1"\s*\}/,
  "the Obsidian process bridge must preserve process.env and disable Python bytecode"
);
assert.match(
  companionSource,
  /environment\s*=\s*os\.environ\.copy\(\)[\s\S]*?environment\["PYTHONDONTWRITEBYTECODE"\]\s*=\s*"1"/,
  "the companion must copy os.environ before enforcing no-bytecode mode"
);
assert.match(
  companionSource,
  /def run_command\([\s\S]*?subprocess\.Popen\([\s\S]*?env=_python_child_environment\(\)/,
  "every allowlisted Python audit must receive the protected child environment"
);

const probeSource = String.raw`
import importlib.util
import json
import pathlib
import sys

module_path = pathlib.Path("companion/vcg_control.py").resolve()
spec = importlib.util.spec_from_file_location("vcg_control_probe", module_path)
if spec is None or spec.loader is None:
    raise RuntimeError("could not load companion module")
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)
action = module.CommandAction(
    "environment probe",
    (
        "python3",
        "-c",
        "import json, os; print(json.dumps({'parent': os.environ.get('VCG_PARENT_ENV_PROBE'), 'dont_write': os.environ.get('PYTHONDONTWRITEBYTECODE')}))",
    ),
    timeout_seconds=10,
)
result = module.run_command("environment-probe", action, timeout_cap=10)
if not result.ok:
    raise RuntimeError(result.stderr)
print(result.stdout, end="")
`;

const probe = spawnSync("python3", ["-c", probeSource], {
  cwd: process.cwd(),
  encoding: "utf8",
  env: {
    ...process.env,
    VCG_PARENT_ENV_PROBE: "preserved",
    PYTHONDONTWRITEBYTECODE: "parent-value"
  }
});
assert.equal(probe.status, 0, probe.stderr || probe.stdout);
assert.deepEqual(JSON.parse(probe.stdout), { parent: "preserved", dont_write: "1" });

console.log("process-env-tests PASS inherited environment and no-bytecode enforcement");
