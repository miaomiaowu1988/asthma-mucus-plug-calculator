"""Build the self-contained static calculator page."""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "source" / "index.template.html"
ENGINE = ROOT / "source" / "model_engine.js"
OUTPUT = ROOT / "docs" / "index.html"
MARKER = "/*__MODEL_ENGINE__*/"


def build() -> Path:
    template = TEMPLATE.read_text(encoding="utf-8")
    engine = ENGINE.read_text(encoding="utf-8")
    if template.count(MARKER) != 1:
        raise RuntimeError("The HTML template must contain exactly one model-engine marker")
    document = template.replace(MARKER, engine)
    if any(token in document for token in ('src="http', "src='http", 'href="http', "href='http")):
        raise RuntimeError("External resources are not allowed in the built page")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(document, encoding="utf-8", newline="\n")
    return OUTPUT


if __name__ == "__main__":
    print(build())
