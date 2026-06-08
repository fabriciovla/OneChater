# Anuncio OneChat — prompt de video (estilo Claude / ChatGPT)

Estética: minimal premium, mucho aire, tipografía grande (Sora), pacing calmo,
crema cálida + índigo profundo de marca, transiciones suaves. Sin stock cliché,
sin texto que rebota. 9:16 vertical para reels/stories/shorts. ~18 s.

---

## A) Prompt maestro (text-to-video: Sora / Veo 3 / Kling / Runway Gen-3)

```
Premium minimalist tech ad for "OneChat", an AI app with persistent memory across
models. Vertical 9:16. Calm, confident pacing. Warm off-white cream backgrounds
alternating with deep indigo-violet gradient backgrounds. Large clean sans-serif
typography (Sora), generous negative space, soft floating gradient orbs (indigo
#6366f1, violet #8b5cf6, purple #a855f7, warm orange #f97316 accent). Smooth
slow camera push-ins and gentle cross-dissolves between scenes. Subtle depth,
soft shadows, glassy white UI cards. No people. Cinematic, intelligent, Apple-x-Anthropic
mood. Light film grain. Scenes: (1) logo reveal — three soft blobs forming, fade in
"OneChat". (2) cream screen, text "Cambiás de IA y empezás de cero". (3) deep indigo
screen, gradient headline "Una memoria. Todas las IAs." (4) three glassy chat cards
(GPT, Claude, Gemini) answering in parallel under a "Memoria activa" chip. (5) a clean
diagram: Usuario -> Memoria Personal (glowing orange node) -> GPT / Claude / Gemini.
(6) indigo CTA "Empezá gratis — onechat.app". Ends on the OneChat logo.
Color grade: warm, soft contrast. 18 seconds.
```

Negative prompt: `people, faces, hands, watermark, stock footage, busy layout, neon, glitch, fast cuts, distorted text, lens flare overload`.

---

## B) Image-to-video (recomendado) — usá los frames de `frames/` como keyframe

Cada PNG = un plano. Animá cada uno 2.5–3.5 s con micro-movimiento. Pegá el frame
y el prompt correspondiente en Runway / Kling / Luma:

| Frame | Plano | Prompt de animación |
|------|-------|----------------------|
| `scene-1.png` | Logo | "slow push-in, the three blobs gently breathe and glow, text settles, soft orbs drift" |
| `scene-2.png` | Problema | "very slow zoom, faint parallax on background orb, text holds, calm" |
| `scene-3.png` | Promesa | "subtle camera drift, the gradient on 'Todas las IAs' shimmers left to right, orbs float" |
| `scene-4.png` | Producto | "the three cards fade/stagger in, skeleton lines shimmer once, green dots pulse" |
| `scene-5.png` | Diagrama | "dashed arrows flow downward Usuario→Memoria→modelos, orange node pulses softly" |
| `scene-6.png` | CTA | "slow push-in to logo, orbs drift, gentle vignette, hold on onechat.app" |

Transición entre planos: **cross-dissolve 0.4 s** (o whip-pan suave en cortes claros).

---

## C) Audio / copy

- **Música**: ambient/electrónica suave, build-up sutil hacia el CTA (Epidemic Sound:
  "minimal tech", "warm corporate", o Artlist "premium ambient"). BPM bajo.
- **Voz en off (opcional, ES neutro/rioplatense)**:
  1. "Cada vez que cambiás de modelo de IA…"
  2. "…volvés a explicar todo de cero."
  3. "OneChat le da a cada usuario una memoria propia."
  4. "Un mensaje, las mejores IAs respondiendo a la vez."
  5. "Tu contexto viaja con vos, entre todos los modelos."
  6. "OneChat. Empezá gratis."
- **Subtítulos**: siempre (la mayoría mira sin sonido). Sora/CapCut auto-caption.

---

## D) Specs de export

- Resolución: 1080×1920 (los PNG salen a 2160×3840 retina; el editor los baja).
- FPS: 30. Duración: 15–20 s. Códec: H.264/H.265, MP4.
- Versión cuadrada 1:1 y 16:9: cambiá `viewport` en `render.py` y re-renderizá.
- Safe area: el contenido ya respeta márgenes para no chocar con la UI de TikTok/IG.

---

## E) Herramientas sugeridas (1 video)

1. **Frames** (este paquete) → `py render.py`.
2. **Image-to-video**: Runway Gen-3 / Kling 1.6 / Luma — animá cada frame.
3. **Montaje**: CapCut o Descript — uní los planos, música, subtítulos, CTA.
4. (Alternativa todo-en-uno) **Sora / Veo 3** con el prompt maestro (sección A).
