"""
Graba reel.html a video (.webm, 1080x1920) usando Playwright. Gratis, sin instalar nada.
Uso:  py record_reel.py
Salida:  ./video/reel.webm
Convertir a .mp4 (opcional): importar en CapCut (gratis) y exportar, o ffmpeg.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = Path(__file__).parent
VID = BASE / "video"
VID.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(
        viewport={"width": 1080, "height": 1920},
        record_video_dir=str(VID),
        record_video_size={"width": 1080, "height": 1920},
    )
    page = ctx.new_page()
    page.goto((BASE / "reel.html").as_uri(), wait_until="load")
    page.wait_for_timeout(1800)  # iframes + tipografías de cada escena
    try:
        page.wait_for_function("window.__reelDone === true", timeout=26000)
    except Exception:
        print("aviso: timeout esperando fin del reel, guardo lo grabado")
    page.wait_for_timeout(900)   # un respiro final sobre el CTA
    tmp = page.video.path()
    ctx.close()                  # finaliza y escribe el webm
    browser.close()

out = VID / "reel.webm"
tmpp = Path(tmp)
if tmpp.exists():
    tmpp.replace(out)
    print("video ->", out)
else:
    print("no se encontró el video temporal:", tmp)
