# OneChat — kit de anuncio para redes

Frames premium estilo Claude/ChatGPT + prompt de video. Vertical 9:16.

## Qué hay
- `scene-1..6.html` — 6 planos del anuncio (HTML, editables).
- `styles.css` — sistema visual (colores/tipografía de marca).
- `render.py` — exporta los HTML a PNG (`frames/`).
- `PROMPT.md` — prompt maestro + prompts por plano + audio + specs.

## Generar las imágenes
```
cd marketing/ad-onechat
py render.py
```
Salen en `frames/scene-1.png … scene-6.png` (2160×3840, retina).

## Hacer el video
Opción rápida: pegá cada PNG + su prompt (ver `PROMPT.md` sección B) en
Runway / Kling / Luma, animá 3 s c/u, y uní en CapCut con música + subtítulos.

Opción todo-en-uno: pegá el prompt maestro (`PROMPT.md` sección A) en Sora o Veo 3.

## Editar
Tocá el texto en los `scene-*.html` y volvé a correr `py render.py`.
Para cuadrado (1:1) o 16:9, cambiá `viewport` en `render.py`.

---

## VIDEO YA GENERADO (gratis, sin IA de pago)
`video/reel.webm` — 1080×1920, ~18 s, transiciones + ken-burns. Hecho con
Playwright (ya instalado). Regenerar:
```
py record_reel.py
```
Pasar a **.mp4**: importá `reel.webm` en **CapCut** (gratis) y exportá, o con ffmpeg:
`ffmpeg -i video/reel.webm -c:v libx264 -pix_fmt yuv420p reel.mp4`
TikTok / Reels / Shorts aceptan webm en la mayoría de los casos igual.

## Rutas 100% gratis para el video
1. **Ya está**: `reel.webm` (este paquete). Le sumás música + subtítulos en CapCut.
2. **Editor gratis** (slideshow premium, sin IA): CapCut o DaVinci Resolve →
   importás los 6 PNG de `frames/` → zoom (ken-burns) + crossfade + música.
3. **IA de video con free tier** (si querés movimiento generado):
   - **Kling** — créditos gratis diarios (generoso)
   - **Hailuo / MiniMax** — créditos gratis diarios
   - **Luma Dream Machine** — free tier mensual
   - **Leonardo.ai** / **Krea.ai** — tokens gratis diarios
   - **Hugging Face Spaces** — modelos open-source gratis (LTX-Video, Wan 2.1, CogVideoX)
   Pegás cada PNG de `frames/` + el prompt de `PROMPT.md` (sección B).
4. **Grabar el reel a pantalla** (gratis, Windows): abrí `reel.html` en el navegador
   a pantalla completa y grabá con la Game Bar (**Win + Alt + R**) u OBS.
