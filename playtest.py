"""Play-test Sizzle & Serve in a real browser: start the shift, cook a salad
with mouse clicks alone, and assert the plate ends up built on the counter.
Usage: python3 playtest.py <game-dir>
"""
import http.server
import socketserver
import sys
import threading
from functools import partial
from pathlib import Path

from playwright.sync_api import sync_playwright

GAME_DIR = Path(sys.argv[1]).resolve()


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


httpd = socketserver.TCPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(GAME_DIR)))
PORT = httpd.server_address[1]
threading.Thread(target=httpd.serve_forever, daemon=True).start()


def state(page):
    return page.evaluate(
        """() => {
        const w = window.__sizzle.getWorld();
        return {
          screen: window.__sizzle.getScreen(),
          phase: w.phase, time: +w.time.toFixed(1),
          chef: { x: Math.round(w.chef.x), y: Math.round(w.chef.y) },
          carrying: w.chef.carrying,
          board: w.board.item, grill: w.grill.item,
          counterPlate: w.counterPlate,
          orders: w.orders.map(o => o.dish),
          coins: w.coins, served: w.served, hearts: w.hearts,
        };
    }"""
    )


with sync_playwright() as pw:
    browser = pw.chromium.launch()
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto(f"http://127.0.0.1:{PORT}/index.html")
    page.wait_for_timeout(500)
    assert state(page)["screen"] == "title", state(page)
    page.keyboard.press("Enter")
    page.wait_for_timeout(500)
    assert state(page)["phase"] == "play", state(page)

    def click(x, y, wait=700):
        page.mouse.click(x, y)
        page.wait_for_timeout(wait)

    def wait_until(pred, timeout=8000):
        import time
        deadline = time.time() + timeout / 1000
        while time.time() < deadline:
            s = state(page)
            if pred(s):
                return s
            page.wait_for_timeout(120)
        raise AssertionError(f"timed out waiting: {state(page)}")

    # Take a plate from the plating counter, then set it back down.
    click(1230, 390)
    wait_until(lambda s: s["carrying"] and s["carrying"]["kind"] == "plate")
    click(1230, 390)
    wait_until(lambda s: s["counterPlate"] is not None)
    # Tomato: crate -> board -> chop x3 -> take -> add to plate.
    click(50, 212)
    wait_until(lambda s: s["carrying"] == {"kind": "item", "item": "tomato", "state": "raw"})
    click(620, 745)
    wait_until(lambda s: s["board"] is not None)
    click(620, 745, 400)
    click(620, 745, 400)
    click(620, 745, 400)
    wait_until(lambda s: s["board"] == {"item": "tomato", "state": "chopped", "progress": 1})
    click(620, 745)
    wait_until(lambda s: s["carrying"] == {"kind": "item", "item": "tomato", "state": "chopped"})
    click(1230, 390)
    wait_until(lambda s: s["counterPlate"] and s["counterPlate"]["contents"] == [{"item": "tomato", "state": "chopped"}])
    print("PLAYTEST OK — salad started:", state(page))
    print("page errors:", errors)
    assert not errors
    browser.close()
httpd.shutdown()
