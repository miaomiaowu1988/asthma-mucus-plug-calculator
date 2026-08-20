from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "source"))

from build_site import build  # noqa: E402


def test_build_produces_self_contained_html() -> None:
    output = build()
    html = output.read_text(encoding="utf-8")

    assert output == ROOT / "docs" / "index.html"
    assert "/*__MODEL_ENGINE__*/" not in html
    assert "root.MucusPlugModel = api" in html
    assert "globalThis.MucusPlugModel" in html
    assert not re.search(r"<(?:script|img)[^>]+src\s*=", html, flags=re.IGNORECASE)
    assert not re.search(r"<link[^>]+href\s*=", html, flags=re.IGNORECASE)


def test_page_uses_frozen_wording_and_no_risk_categories() -> None:
    html = build().read_text(encoding="utf-8")

    required = (
        "High Mucus Plug Burden Calculator",
        "Estimated probability of high mucus plug burden",
        "18-segment mucus plug score ≥4",
        "Not a future-risk model.",
        "No patient data are transmitted or stored.",
    )
    forbidden = (
        "Low risk",
        "Intermediate risk",
        "High risk",
        "CT recommended",
        "CT not needed",
        "validated clinical model",
        "Powered by AI",
        "18-segment MPS",
    )

    for text in required:
        assert text in html
    for text in forbidden:
        assert text not in html
