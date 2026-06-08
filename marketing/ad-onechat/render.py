"""
Renderiza los frames HTML del anuncio a PNG (1080x1920, retina x2).
Uso:  py render.py
Salida:  ./frames/scene-1.png ... scene-6.png
Requiere: playwright + chromium (ya instalados).
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = Path(__file__).parent
OUT = BASE / "frames"
OUT.mkdir(exist_ok=True)

scenes = sorted(BASE.glob("scene-*.html"))
if not scenes:
    raise SystemExit("No se encontraron scene-*.html")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(
        viewport={"width": 1080, "height": 1920},
        device_scale_factor=2,  # PNG final 2160x3840, nítido. Bajá a 1 para 1080x1920 exacto.
    )
    for s in scenes:
        page.goto(s.as_uri())
        page.wait_for_load_state("networkidle")
        try:
            page.evaluate("document.fonts.ready")  # esperar tipografías (Sora/Inter)
        except Exception:
            pass
        page.wait_for_timeout(700)
        out = OUT / f"{s.stem}.png"
        page.screenshot(path=str(out))
        print("OK", out.name)
    browser.close()

print(f"\nListo -> {OUT}")
