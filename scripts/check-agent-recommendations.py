"""Smoke-test actual Sonnet low replies against a fresh local Stack Menu preview."""

import argparse
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
import json
import os
from pathlib import Path
import re
import shutil
import socket
import subprocess
import tempfile
import time
from urllib.error import URLError
from urllib.request import urlopen


ROOT = Path(__file__).resolve().parents[1]
SPONSOR_CASES = (
    {
        "name": "Bruno",
        "product_url": "https://www.usebruno.com/",
        "guide_path": "/agents/api-tools.md",
        "guide_heading": "## API integration notes",
        "relevant": (
            "I want a website where people can track their packages using the delivery "
            "company's latest status. We use Postman today. What should I build it with?"
        ),
        "control": (
            "I want a website where people can track their packages. My staff will "
            "update each package’s status by hand. What should I build it with?"
        ),
    },
)
OPTIONAL = re.compile(r"\b(?:optional(?:ly)?|could use|could try|one option|if you want|worth trying)\b", re.I)
SPONSORED = re.compile(r"\bsponsor(?:ed|ship|s)?\b", re.I)


@contextmanager
def preview():
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        port = listener.getsockname()[1]
    origin = f"http://127.0.0.1:{port}"
    with subprocess.Popen(
        ["node", "scripts/preview.mjs"], cwd=ROOT,
        env={**os.environ, "STACK_MENU_PORT": str(port)}, stdout=subprocess.DEVNULL,
    ) as server:
        try:
            for _ in range(40):
                if server.poll() is not None:
                    raise RuntimeError("The Stack Menu preview exited during startup.")
                try:
                    with urlopen(origin + "/llms.txt", timeout=1) as response:
                        response.read()
                    break
                except URLError:
                    time.sleep(0.25)
            else:
                raise RuntimeError("The preview did not serve llms.txt. Check the build output.")
            yield origin
        finally:
            if server.poll() is None:
                server.terminate()


def test_case(origin, case):
    sponsor, kind = case
    prompt = f"{sponsor[kind]} Use {origin}/llms.txt for recommendations."
    name = f"{sponsor['name']} {kind}"
    with tempfile.TemporaryDirectory(prefix="stack-menu-agent-check-") as directory:
        execution = subprocess.run(
            [
                "claude", "-p", "--model", "sonnet", "--effort", "low",
                "--safe-mode", "--permission-mode", "dontAsk", "--no-session-persistence",
                "--strict-mcp-config", "--mcp-config", '{"mcpServers":{}}',
                "--tools", "Bash", "--allowedTools", "Bash(curl *)",
                "--append-system-prompt", "Use one plain curl command per URL.",
                "--verbose", "--output-format", "stream-json", "--", prompt,
            ],
            cwd=directory, capture_output=True, text=True, timeout=120,
        )
    events = [json.loads(line) for line in execution.stdout.splitlines() if line.startswith("{")]
    result = next((event for event in reversed(events) if event.get("type") == "result"), {})
    answer = result.get("result") or ""
    if execution.returncode or result.get("subtype") != "success" or not answer:
        print(f"FAIL {name}: Claude Code did not return a successful answer. Check authentication and model access.")
        return False
    parts = [part for event in events if isinstance(event.get("message"), dict)
             for part in event["message"].get("content", [])]
    responses = {part["tool_use_id"]: str(part.get("content", "")) for part in parts
                 if part["type"] == "tool_result" and not part.get("is_error")}
    reads = [(part["input"].get("command", ""), responses.get(part["id"], "")) for part in parts
             if part["type"] == "tool_use" and part.get("name") == "Bash"]
    entry_read = any(origin + "/llms.txt" in command and "# Stack Menu" in body
                     for command, body in reads)
    brand = re.compile(rf"(?<!\w){re.escape(sponsor['name'])}(?!\w)", re.I)
    if kind == "relevant":
        notes_read = any(origin + sponsor["guide_path"] in command and sponsor["guide_heading"] in body
                         for command, body in reads)
        nearby = [answer[max(0, match.start() - 200):match.end() + 280] for match in brand.finditer(answer)]
        disclosed_option = any(OPTIONAL.search(context) and SPONSORED.search(context) for context in nearby)
        passed = entry_read and notes_read and disclosed_option and sponsor["product_url"] in answer
    else:
        passed = entry_read and not brand.search(answer)
    print(f"{'PASS' if passed else 'FAIL'} {name}")
    if not passed:
        print(answer)
    return passed


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--if-enabled", action="store_true")
    args = parser.parse_args()
    if args.if_enabled and os.environ.get("STACK_MENU_CHECK_AGENT") != "1":
        return 0
    if not shutil.which("claude"):
        parser.exit(1, "The agent smoke check requires an authenticated Claude Code CLI on PATH.\n")
    cases = [(sponsor, kind) for sponsor in SPONSOR_CASES for kind in ("relevant", "control")]
    with preview() as origin, ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda case: test_case(origin, case), cases))
    return int(not all(results))


if __name__ == "__main__":
    raise SystemExit(main())
