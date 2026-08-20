"""Scan the built page for network, storage, analytics, and tracking features."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_HTML = ROOT / "docs" / "index.html"
DEFAULT_REPORT = ROOT / "test_artifacts" / "privacy_scan.json"

FORBIDDEN_PATTERNS = {
    "fetch": r"\bfetch\s*\(",
    "xml_http_request": r"\bXMLHttpRequest\b",
    "websocket": r"\bWebSocket\b",
    "beacon": r"\bsendBeacon\b",
    "local_storage": r"\blocalStorage\b",
    "session_storage": r"\bsessionStorage\b",
    "cookies": r"document\.cookie",
    "analytics": r"google-analytics|googletagmanager|gtag\s*\(|plausible\.io|matomo",
    "external_url": r"https?://",
    "external_script": r"<script[^>]+src\s*=",
    "external_stylesheet": r"<link[^>]+href\s*=",
    "external_form": r"<form[^>]+action\s*=",
}


def scan(html_path: Path) -> dict[str, object]:
    source = html_path.read_text(encoding="utf-8")
    findings = {
        name: [match.group(0) for match in re.finditer(pattern, source, re.IGNORECASE)]
        for name, pattern in FORBIDDEN_PATTERNS.items()
    }
    findings = {name: matches for name, matches in findings.items() if matches}
    return {
        "file": str(html_path),
        "bytes": html_path.stat().st_size,
        "external_api_calls": 0 if "fetch" not in findings and "xml_http_request" not in findings else None,
        "analytics": 0 if "analytics" not in findings else None,
        "patient_storage": 0 if not {"local_storage", "session_storage", "cookies"}.intersection(findings) else None,
        "hidden_tracking": 0 if not {"analytics", "beacon", "external_url"}.intersection(findings) else None,
        "findings": findings,
        "pass": not findings,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--html", type=Path, default=DEFAULT_HTML)
    parser.add_argument("--output", type=Path, default=DEFAULT_REPORT)
    args = parser.parse_args()

    report = scan(args.html.resolve())
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    if not report["pass"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
