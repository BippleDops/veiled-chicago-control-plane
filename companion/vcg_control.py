#!/usr/bin/env python3
"""Run the Veiled Chicago Control Plane's fixed local actions.

This is deliberately not a general command runner.  The Obsidian plugin passes
one compiled action ID; this wrapper maps it to an argv tuple or to the local
map lifecycle manager.  Note content, URLs, and shell syntax are never accepted
as executable input.
"""

from __future__ import annotations

import argparse
from contextlib import contextmanager
import fcntl
import json
import os
import shutil
import signal
import socket
import subprocess
import sys
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Callable, Sequence


SCRIPT_PATH = Path(__file__).resolve()


def _find_vault_root() -> Path:
    for candidate in (SCRIPT_PATH.parent, *SCRIPT_PATH.parents):
        if (candidate / ".obsidian").is_dir() and (candidate / "1-Campaign").is_dir():
            return candidate
    return SCRIPT_PATH.parent.parent


ROOT = _find_vault_root()
AUTOMATION_SCRIPTS = Path("9-System/Automation/scripts")
MAP_ROOT = ROOT / "9-System/Apps/veiled-chicago-map"
STATE_DIR = ROOT / ".tmp" / "vcg-control"
STATE_PATH = STATE_DIR / "map-server.json"
LOCK_PATH = STATE_DIR / "map-server.lock"
LOG_PATH = STATE_DIR / "map-server.log"
MAP_HOST = "127.0.0.1"
MAP_PORT = 5173
MAX_CAPTURE_BYTES = 2 * 1024 * 1024


@dataclass(frozen=True)
class Result:
    action: str
    ok: bool
    exit_code: int
    stdout: str
    stderr: str
    duration_ms: int


@dataclass(frozen=True)
class CommandAction:
    description: str
    argv: tuple[str, ...]
    timeout_seconds: int = 180


COMMAND_ACTIONS: dict[str, CommandAction] = {
    "live-edge": CommandAction(
        "Check live-canon and player-choice boundaries.",
        ("python3", str(AUTOMATION_SCRIPTS / "check_live_edge.py")),
    ),
    "navigation": CommandAction(
        "Validate required operational routes and appearance state.",
        ("python3", str(AUTOMATION_SCRIPTS / "vault_navigation_audit.py")),
    ),
    "links-live": CommandAction(
        "Validate live-scope internal links.",
        ("python3", str(AUTOMATION_SCRIPTS / "vault_link_audit.py"), "--live", "--strict"),
    ),
    "frontmatter-live": CommandAction(
        "Validate live-scope frontmatter.",
        ("python3", str(AUTOMATION_SCRIPTS / "frontmatter_validator.py"), "--scope", "live", "--strict"),
    ),
    "css-audit": CommandAction(
        "Parse and audit the local Obsidian CSS system.",
        ("python3", str(AUTOMATION_SCRIPTS / "audit_obsidian_css.py"), "--json"),
    ),
}

MAP_ACTIONS: dict[str, tuple[str, Callable[[], tuple[bool, int, str, str]]]] = {}


def _limited(value: str) -> str:
    encoded = value.encode("utf-8", errors="replace")
    if len(encoded) <= MAX_CAPTURE_BYTES:
        return value
    return encoded[-MAX_CAPTURE_BYTES:].decode("utf-8", errors="replace")


def _port_open(timeout: float = 0.3) -> bool:
    try:
        with socket.create_connection((MAP_HOST, MAP_PORT), timeout=timeout):
            return True
    except OSError:
        return False


def _read_state() -> dict[str, object] | None:
    try:
        value = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except (FileNotFoundError, OSError, json.JSONDecodeError):
        return None
    return value if isinstance(value, dict) else None


def _write_state(value: dict[str, object]) -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    temporary = STATE_DIR / f"map-server.{os.getpid()}.tmp"
    try:
        with temporary.open("w", encoding="utf-8") as handle:
            handle.write(json.dumps(value, indent=2) + "\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, STATE_PATH)
    finally:
        temporary.unlink(missing_ok=True)


@contextmanager
def _map_lock() -> object:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    with LOCK_PATH.open("a+", encoding="utf-8") as handle:
        fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(handle.fileno(), fcntl.LOCK_UN)


def _pid(value: object) -> int | None:
    if isinstance(value, bool) or not isinstance(value, int) or value <= 1:
        return None
    return value


def _process_exists(pid: int) -> bool:
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except (PermissionError, OSError):
        return True
    return True


def _process_group_exists(pgid: int) -> bool:
    try:
        os.killpg(pgid, 0)
    except ProcessLookupError:
        return False
    except (PermissionError, OSError):
        return True
    return True


def _process_command(pid: int) -> str | None:
    try:
        result = subprocess.run(
            ["ps", "-p", str(pid), "-o", "command="],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
            timeout=3,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    command = result.stdout.strip()
    return command if result.returncode == 0 and command else None


def _process_start_identity(pid: int) -> str | None:
    try:
        result = subprocess.run(
            ["ps", "-p", str(pid), "-o", "lstart="],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
            timeout=3,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    value = " ".join(result.stdout.split())
    return value if result.returncode == 0 and value else None


def _process_cwd(pid: int) -> str | None:
    lsof = shutil.which("lsof")
    if lsof is None:
        return None
    try:
        result = subprocess.run(
            [lsof, "-a", "-p", str(pid), "-d", "cwd", "-Fn"],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
            timeout=3,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    if result.returncode != 0:
        return None
    return next((line[1:] for line in result.stdout.splitlines() if line.startswith("n/")), None)


def _listener_pids() -> set[int] | None:
    lsof = shutil.which("lsof")
    if lsof is None:
        return None
    try:
        result = subprocess.run(
            [lsof, "-nP", f"-iTCP:{MAP_PORT}", "-sTCP:LISTEN", "-t"],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
            timeout=3,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    if result.returncode not in {0, 1}:
        return None
    values: set[int] = set()
    for line in result.stdout.splitlines():
        try:
            value = int(line.strip())
        except ValueError:
            return None
        if value > 1:
            values.add(value)
    return values


def _listener_owned_by_group(pgid: int) -> tuple[bool, str]:
    listeners = _listener_pids()
    if listeners is None:
        return False, "Listener ownership could not be inspected with lsof."
    if not listeners:
        return False, f"No listener owns {MAP_HOST}:{MAP_PORT}."
    foreign: list[int] = []
    for listener_pid in sorted(listeners):
        try:
            listener_pgid = os.getpgid(listener_pid)
        except (ProcessLookupError, PermissionError, OSError):
            foreign.append(listener_pid)
            continue
        if listener_pgid != pgid:
            foreign.append(listener_pid)
    if foreign:
        return False, f"Port {MAP_PORT} has listener PID(s) outside the recorded process group: {foreign}."
    return True, f"Listener PID(s) {sorted(listeners)} belong to process group {pgid}."


def _is_managed_process(state: dict[str, object]) -> tuple[bool, str]:
    pid = _pid(state.get("pid"))
    if pid is None:
        return False, "The recorded map PID is invalid."
    pgid = _pid(state.get("pgid"))
    if pgid is None or pgid != pid:
        return False, "The recorded process-group identity is invalid."
    try:
        actual_pgid = os.getpgid(pid)
    except (ProcessLookupError, PermissionError, OSError):
        return False, "The recorded map process is not running or cannot be inspected."
    if actual_pgid != pgid:
        return False, f"PID {pid} now belongs to process group {actual_pgid}, not recorded group {pgid}."
    command = _process_command(pid)
    if command is None:
        return False, "The recorded map process is not running."
    expected_root = str(MAP_ROOT.resolve())
    recorded_root = str(state.get("cwd", ""))
    if recorded_root != expected_root:
        return False, "The recorded working directory does not match the vault map app."
    actual_root = _process_cwd(pid)
    if actual_root != expected_root:
        return False, f"PID {pid} has unexpected working directory: {actual_root or 'unavailable'}."
    recorded_start = state.get("process_start")
    actual_start = _process_start_identity(pid)
    if not isinstance(recorded_start, str) or not recorded_start or actual_start != recorded_start:
        return False, "The process start identity does not match; the PID may have been reused."
    command_lower = command.lower()
    required_parts = ("npm", "dev:dm", "--host", MAP_HOST, "--port", str(MAP_PORT), "--strictport")
    if any(part.lower() not in command_lower for part in required_parts):
        return False, f"PID {pid} is not the managed npm dev:dm process."
    if _port_open():
        owned, listener_detail = _listener_owned_by_group(pgid)
        if not owned:
            return False, listener_detail
    return True, command


def _tail_log(lines: int = 40) -> str:
    try:
        values = LOG_PATH.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError:
        return ""
    return "\n".join(values[-lines:])


def map_status() -> tuple[bool, int, str, str]:
    state = _read_state()
    if state is None:
        detail = "No control-plane map process is recorded."
        if _port_open():
            detail += f" Port {MAP_PORT} is in use by an unmanaged process."
            return False, 2, detail, "Refusing to claim or stop an unmanaged listener."
        return True, 0, f"STOPPED — {detail}", ""
    valid, detail = _is_managed_process(state)
    if not valid:
        listener = "open" if _port_open() else "closed"
        return False, 2, f"STALE — {detail} Port {MAP_PORT} is {listener}.", ""
    listener = _port_open()
    pid = _pid(state.get("pid"))
    started = str(state.get("started_at", "unknown"))
    if not listener:
        return False, 3, f"DEGRADED — PID {pid} is running but {MAP_HOST}:{MAP_PORT} is closed.", detail
    return True, 0, f"RUNNING — PID {pid}; {MAP_HOST}:{MAP_PORT}; started {started}.", ""


def map_start() -> tuple[bool, int, str, str]:
    state = _read_state()
    if state is not None:
        valid, _ = _is_managed_process(state)
        if valid and _port_open():
            return True, 0, "The managed map server is already running.", ""
        if valid:
            return False, 3, "A managed map process exists but is not listening.", _tail_log()
        return False, 2, "A stale map state file exists; inspect or run map-stop before starting.", ""
    if _port_open():
        return False, 2, f"Port {MAP_PORT} is already in use by an unmanaged process.", ""
    if not (MAP_ROOT / "package.json").is_file():
        return False, 4, f"Missing map package: {MAP_ROOT / 'package.json'}", ""
    if not (MAP_ROOT / "node_modules").is_dir():
        return False, 4, "Map dependencies are not installed; run npm install in 9-System/Apps/veiled-chicago-map first.", ""
    npm = shutil.which("npm")
    if npm is None:
        return False, 4, "npm is not available on PATH.", ""

    STATE_DIR.mkdir(parents=True, exist_ok=True)
    command = [
        npm,
        "run",
        "dev:dm",
        "--",
        "--host",
        MAP_HOST,
        "--port",
        str(MAP_PORT),
        "--strictPort",
    ]
    with LOG_PATH.open("a", encoding="utf-8") as log:
        log.write(f"\n[{time.strftime('%Y-%m-%dT%H:%M:%S%z')}] starting loopback map server\n")
        log.flush()
        process = subprocess.Popen(  # noqa: S603 - argv is a fixed internal allowlist
            command,
            cwd=MAP_ROOT,
            stdin=subprocess.DEVNULL,
            stdout=log,
            stderr=subprocess.STDOUT,
            start_new_session=True,
            text=True,
        )

    previous_sigterm = signal.getsignal(signal.SIGTERM)
    keep_running = False

    def cancel_start(_signum: int, _frame: object) -> None:
        raise SystemExit(143)

    signal.signal(signal.SIGTERM, cancel_start)
    try:
        try:
            actual_pgid = os.getpgid(process.pid)
        except (ProcessLookupError, PermissionError, OSError) as exc:
            return False, 6, "The map process identity could not be inspected after start.", str(exc)
        process_start = _process_start_identity(process.pid)
        process_cwd = _process_cwd(process.pid)
        if actual_pgid != process.pid or not process_start or process_cwd != str(MAP_ROOT.resolve()):
            return False, 6, "The map process failed post-start identity validation.", "No state file was retained."

        state_payload = {
            "schema_version": 1,
            "pid": process.pid,
            "pgid": process.pid,
            "cwd": str(MAP_ROOT.resolve()),
            "process_start": process_start,
            "host": MAP_HOST,
            "port": MAP_PORT,
            "started_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            "argv": command[1:],
        }
        _write_state(state_payload)

        deadline = time.monotonic() + 12
        while time.monotonic() < deadline:
            if process.poll() is not None:
                return False, process.returncode or 1, "The map server exited during startup.", _tail_log()
            if _port_open():
                owned, detail = _listener_owned_by_group(process.pid)
                if not owned:
                    return False, 6, "The map listener failed ownership validation.", detail
                keep_running = True
                return True, 0, f"Started Veiled Chicago Map at http://{MAP_HOST}:{MAP_PORT}/ (PID {process.pid}).", ""
            time.sleep(0.2)
    finally:
        signal.signal(signal.SIGTERM, previous_sigterm)
        if not keep_running:
            terminated = _terminate_group(process)
            current_state = _read_state()
            if terminated and current_state is not None and _pid(current_state.get("pid")) == process.pid:
                STATE_PATH.unlink(missing_ok=True)

    return False, 5, "The map server did not open its loopback port within 12 seconds.", _tail_log()


def map_stop() -> tuple[bool, int, str, str]:
    state = _read_state()
    if state is None:
        if _port_open():
            return False, 2, "No managed map process is recorded, but the port is in use.", "Refusing to stop an unmanaged process."
        return True, 0, "The managed map server is already stopped.", ""
    valid, detail = _is_managed_process(state)
    if not valid:
        if _port_open():
            return False, 2, f"Stale state: {detail}", "Refusing to stop an unverified listener."
        recorded_pid = _pid(state.get("pid"))
        recorded_pgid = _pid(state.get("pgid"))
        if recorded_pid is not None and _process_exists(recorded_pid):
            return False, 2, f"Unverified live process: {detail}", "State retained; no signal was sent."
        if recorded_pgid is not None and _process_group_exists(recorded_pgid):
            return False, 2, f"Unverified live process group: {detail}", "State retained; no signal was sent."
        listeners = _listener_pids()
        if listeners is None or listeners:
            return False, 2, f"Stale state could not be proven safe to remove: {detail}", "State retained."
        STATE_PATH.unlink(missing_ok=True)
        return True, 0, f"Removed demonstrably stale state; no process was signaled. {detail}", ""

    pid = _pid(state.get("pid"))
    pgid = _pid(state.get("pgid"))
    if pid is None or pgid != pid:
        return False, 2, "Recorded process-group identity is invalid.", "No signal was sent."
    try:
        os.killpg(pgid, signal.SIGTERM)
    except ProcessLookupError:
        listeners = _listener_pids()
        if listeners == set() and not _port_open():
            STATE_PATH.unlink(missing_ok=True)
            return True, 0, "The managed process group had already exited; stale state removed.", ""
        return False, 7, "The recorded process group is absent but listener closure was not proved.", "State retained."
    except PermissionError as exc:
        return False, 6, "Permission denied while stopping the managed map process.", str(exc)

    deadline = time.monotonic() + 6
    while time.monotonic() < deadline:
        listeners = _listener_pids()
        if not _process_group_exists(pgid) and listeners == set() and not _port_open():
            STATE_PATH.unlink(missing_ok=True)
            return True, 0, f"Stopped the managed map server (PID {pid}).", ""
        time.sleep(0.15)
    return False, 7, f"Process group {pgid} or its listener did not close after SIGTERM.", "State retained; no stronger signal was sent."


MAP_ACTIONS.update(
    {
        "map-status": ("Check the managed loopback map process.", map_status),
        "map-start": ("Start the reviewed map app on loopback.", map_start),
        "map-stop": ("Stop only the recorded, validated map process group.", map_stop),
    }
)


def _terminate_group(process: subprocess.Popen[str], wait_seconds: float = 2.0) -> bool:
    for requested_signal in (signal.SIGTERM, signal.SIGKILL):
        process.poll()
        if not _process_group_exists(process.pid):
            return True
        try:
            os.killpg(process.pid, requested_signal)
        except ProcessLookupError:
            return True
        except (PermissionError, OSError):
            return False
        deadline = time.monotonic() + wait_seconds
        while time.monotonic() < deadline:
            process.poll()
            if not _process_group_exists(process.pid):
                try:
                    process.wait(timeout=0.1)
                except (subprocess.TimeoutExpired, ChildProcessError):
                    pass
                return True
            time.sleep(0.05)
    return not _process_group_exists(process.pid)


def run_command(action_id: str, action: CommandAction, timeout_cap: int | None = None) -> Result:
    started = time.monotonic()
    timeout_seconds = min(action.timeout_seconds, timeout_cap) if timeout_cap is not None else action.timeout_seconds
    try:
        process = subprocess.Popen(  # noqa: S603 - argv comes from COMMAND_ACTIONS only
            action.argv,
            cwd=ROOT,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            start_new_session=True,
        )
        previous_sigterm = signal.getsignal(signal.SIGTERM)

        def cancel_command(_signum: int, _frame: object) -> None:
            _terminate_group(process)
            raise SystemExit(143)

        signal.signal(signal.SIGTERM, cancel_command)
        try:
            raw_stdout, raw_stderr = process.communicate(timeout=timeout_seconds)
        except subprocess.TimeoutExpired:
            if not _terminate_group(process):
                return Result(
                    action_id,
                    False,
                    125,
                    "",
                    "Timed-out action could not be terminated; inspect the recorded process group.",
                    round((time.monotonic() - started) * 1000),
                )
            raw_stdout, raw_stderr = process.communicate()
            raw_stderr = f"{raw_stderr}\nAction timed out after {timeout_seconds} seconds.".strip()
            code = 124
            return Result(
                action_id,
                False,
                code,
                _limited(raw_stdout),
                _limited(raw_stderr),
                round((time.monotonic() - started) * 1000),
            )
        finally:
            signal.signal(signal.SIGTERM, previous_sigterm)
        stdout = _limited(raw_stdout)
        stderr = _limited(raw_stderr)
        code = process.returncode or 0
        ok = code == 0
    except OSError as exc:
        stdout = ""
        stderr = str(exc)
        code = 127
        ok = False
    return Result(action_id, ok, code, stdout, stderr, round((time.monotonic() - started) * 1000))


def run_action(action_id: str, timeout_cap: int | None = None) -> Result:
    started = time.monotonic()
    if action_id in COMMAND_ACTIONS:
        return run_command(action_id, COMMAND_ACTIONS[action_id], timeout_cap)
    map_action = MAP_ACTIONS.get(action_id)
    if map_action is not None:
        try:
            with _map_lock():
                ok, code, stdout, stderr = map_action[1]()
        except OSError as exc:
            ok, code, stdout, stderr = False, 127, "", str(exc)
        return Result(action_id, ok, code, stdout, stderr, round((time.monotonic() - started) * 1000))
    return Result(action_id, False, 64, "", f"Unknown allowlisted action: {action_id}", 0)


def list_actions() -> list[dict[str, object]]:
    rows = [
        {"id": action_id, "description": action.description, "kind": "command", "argv": list(action.argv)}
        for action_id, action in sorted(COMMAND_ACTIONS.items())
    ]
    rows.extend(
        {"id": action_id, "description": value[0], "kind": "map-lifecycle"}
        for action_id, value in sorted(MAP_ACTIONS.items())
    )
    return rows


def emit(result: Result, as_json: bool) -> None:
    if as_json:
        print(json.dumps(asdict(result), ensure_ascii=False))
        return
    state = "PASS" if result.ok else "ATTENTION"
    print(f"{state} {result.action} ({result.duration_ms} ms)")
    if result.stdout:
        print(result.stdout.rstrip())
    if result.stderr:
        print(result.stderr.rstrip(), file=sys.stderr)


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    listing = subparsers.add_parser("list", help="List the fixed action registry.")
    listing.add_argument("--json", action="store_true")
    runner = subparsers.add_parser("run", help="Run one fixed action by ID.")
    runner.add_argument("action", choices=sorted([*COMMAND_ACTIONS, *MAP_ACTIONS]))
    runner.add_argument("--json", action="store_true")
    runner.add_argument("--timeout-seconds", type=int, help="Optional 2–300 second cap for foreground audits.")
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    if args.command == "list":
        actions = list_actions()
        print(json.dumps(actions, indent=2) if args.json else "\n".join(f"{row['id']}: {row['description']}" for row in actions))
        return 0
    if args.timeout_seconds is not None and not 2 <= args.timeout_seconds <= 300:
        raise SystemExit("--timeout-seconds must be between 2 and 300")
    result = run_action(args.action, args.timeout_seconds)
    emit(result, args.json)
    return 0 if result.ok else result.exit_code or 1


if __name__ == "__main__":
    raise SystemExit(main())
