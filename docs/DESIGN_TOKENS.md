# Design tokens — Đông prototype v7

Source: `dongnnh2112work/tap-tap` (read-only), chiefly `demo/motion-v7/index.html`, `docs/04-art-style.md`, and `docs/05-motion.md`. These values are the consumer UI. Admin and the tenant dashboard keep their own chrome.

## Color

| Token | Value | Use |
|---|---|---|
| `--bg-top` | `#fdf8ee` | Page wash, top |
| `--bg-bottom` | `#f3e9d2` | Page wash, bottom |
| `--ink-dark` | `#2c221e` | Text, brand pill, primary button |
| `--ink-muted` | `#6e5d53` | Secondary text |
| `--card-cream` | `#fffdf8` | Card face, chips |
| `--card-back-cream` | `#faf1de` | Card back |
| `--card-border` | `#efe6d5` | Hairline borders |
| `--card-edge` | `#e6dac6` | Card rim |
| Theme pastel (capybara) | `#f4e894` | Series chip, glow |
| Theme accent (capybara) | `#d97724` | Brand mark, active chip |
| Elephant pastel / accent | `#cde6d0` / `#2f8568` | |
| Giraffe pastel / accent | `#ffd2b1` / `#d95b26` | |
| Orangutan pastel / accent | `#d8cfec` / `#6f42c1` | One animal theme, not a page-wide purple gradient |
| Intro scrim | `#261d19` → `#1b1411` | NFC intro overlay |
| Business ink | `#15202b` | Business path only, separate from the player wash |

Page background is a vertical cream wash plus one soft pastel halo (`blur: 56px`, opacity `0.58`) behind the card. Paper grain is a 18px dot grid at opacity `0.28`.

## Type

| Role | Family | Weight | Size |
|---|---|---|---|
| Display, card name, brand | Baloo 2 | 700–800 | Card name ~1.35–1.7rem, brand 1.05rem |
| UI, body, buttons | Be Vietnam Pro | 500–700 | Body 15–17px, chips 12–13px |
| Mono (codes) | JetBrains Mono | 600 | 11–12px |

EN is the default. VI uses the same families (Be Vietnam Pro covers Vietnamese).

## Radii, shadow, spacing

| Token | Value |
|---|---|
| Card corner | `26px` |
| Intro / sheet | `28px` |
| Fact panel | `18px` |
| Pills, buttons | `999px` |
| Shell max width | `440px` |
| Page padding | `16px` horizontal, safe-area top/bottom |
| Stack gap | `8px` inside bars, `12–16px` between sections |
| Card shadow | `translate(var(--shadow-x), 22px)` blur `38px`, ink at ~28% |
| Brand pill shadow | `0 4px 12px rgba(44, 34, 30, 0.06)` |
| Primary button shadow | `0 8px 22px rgba(44, 34, 30, 0.22)` |

Rhythm is 4px. Tap targets stay at least 44px.

## GSAP motion (v7)

Library: GSAP 3 core. Eases below are the strings in the prototype, not CSS approximations.

| Moment | Duration | Ease |
|---|---|---|
| NFC core pop | `0.18s` | `back.out(2)` |
| NFC rings | `0.44s`, stagger `0.06s` | `power2.out` |
| Intro fade out | `0.22s` | `power2.in` |
| Card opacity in | `0.14s` | `none` |
| Card fly to center | `0.88s` | `elastic.out(1, 0.58)` |
| Landing tilt settle | `0.92s` from `rotateX 24 / rotateY -22` | `elastic.out(1, 0.52)` |
| Confetti mote | `0.75–1.0s` | `power3.out` |
| Holo glare | `0.26s` | `power3.out` (`gsap.quickTo`) |
| Specular position | `0.32–0.34s` | `power3.out` |
| Rainbow position | `0.36s` | `power3.out` |
| Holo opacity | `0.30s` | `power2.out` |
| Flip | `0.62s` | `back.out(1.7)` |
| Press | `0.15s` | scale `0.97` |

Intro placeholder in the prototype runs about 4 seconds and can be skipped. Our collect flow keeps a short ripple, then the card. Reduced motion skips tilt, flip, and fly-in and fades opacity only.

## Device tilt

- Max tilt `22°` (`MAX_TILT_DEG`).
- Pointer: drag tilts; a short tap flips. Movement under ~7px counts as a tap.
- Gyro (optional, after a permission tap on iOS): `gamma` drives `rotateY`, `beta` drives `rotateX`, clamped to ±22°.
- Art shifts opposite the tilt (`±14px`); the nameplate shifts with it (`±5.5px`) so the card feels layered.
- Holo is a soft specular band plus a faint rainbow. It stays near 0 at rest and ramps with tilt (smoothstep). Peak rainbow opacity about `0.55`.
- `prefers-reduced-motion: reduce`: no tilt, no flip, no holo sweep. The back face fades in.

## 3D card

- Perspective `1100px` on the stage.
- Front and back are two faces, `backface-visibility: hidden`, back pre-rotated `180°`.
- Flip adds `180°` to `rotateY` on top of the tilt.
- The painted WebP already includes the white rounded frame and the blank nameplate. The live name sits in that blank band. Animals without a file get a cream-to-pastel card and a single initial, not a broken image.
