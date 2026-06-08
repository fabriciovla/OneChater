from playwright.sync_api import sync_playwright
import time
with sync_playwright() as p:
    b=p.chromium.launch()
    m=b.new_page(viewport={"width":390,"height":844}, device_scale_factor=2)
    m.goto("http://localhost:3137/", wait_until="networkidle", timeout=60000)
    time.sleep(3.0)
    m.screenshot(path="x_mhero.png")
    m.screenshot(path="x_mfull.png", full_page=True)
    m.close()
    d=b.new_page(viewport={"width":1280,"height":900}, device_scale_factor=1)
    d.goto("http://localhost:3137/", wait_until="networkidle", timeout=60000)
    time.sleep(3.0)
    d.screenshot(path="x_dfull.png", full_page=True)
    d.close()
    b.close()
print("done")
