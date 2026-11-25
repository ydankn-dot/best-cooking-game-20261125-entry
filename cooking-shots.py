"""Take the four Sizzle & Serve screenshots with headless Chromium (Playwright).

Usage: python3 cooking-shots.py <game-dir> <shots-dir>
Serves game/ over HTTP on localhost, opens each ?shot= scene at 1280x800,
waits for the staged frame, and writes JPEGs under 256 KiB each.
"""
import http.server
import json
import socketserver
import sys
import threading
from functools import partial
from pathlib import Path

from playwright.sync_api import sync_playwright

GAME_DIR = Path(sys.argv[1]).resolve()
SHOTS_DIR = Path(sys.argv[2]).resolve()
SHOTS_DIR.mkdir(parents=True, exist_ok=True)
PORT = 8931

SHOTS = json.loads((GAME_DIR.parent / "shots.json").read_text())


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


httpd = socketserver.TCPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(GAME_DIR)))
PORT = httpd.server_address[1]
threading.Thread(target=httpd.serve_forever, daemon=True).start()

from PIL import Image

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    for shot in SHOTS:
        page = browser.new_page(viewport={"width": 1280, "height": 800}, device_scale_factor=1)
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"http://127.0.0.1:{PORT}/index.html{shot['query']}")
        page.wait_for_function("window.__shotReady === true", timeout=30000)
        page.wait_for_timeout(400)
        png = SHOTS_DIR / (shot["name"] + ".png")
        page.screenshot(path=str(png))
        print("shot", png, png.stat().st_size, "errors:", errors)
        page.close()
    browser.close()

httpd.shutdown()

for shot in SHOTS:
    src = SHOTS_DIR / (shot["name"] + ".png")
    dst = SHOTS_DIR / shot["name"]
    im = Image.open(src).convert("RGB")
    assert im.size == (1280, 800), im.size
    for quality in (88, 82, 76, 70, 62, 55):
        im.save(dst, "JPEG", quality=quality, optimize=True)
        if dst.stat().st_size <= 250_000:
            break
    print("jpeg", dst, dst.stat().st_size, "quality", quality)
    src.unlink()
