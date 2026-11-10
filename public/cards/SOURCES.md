# Card art sources

Paintings are from the public repo `dongnnh2112work/tap-tap` (not modified). Each file was resized to a mobile width (portraits 537px, framed cards 800px) and encoded as WebP. Nothing else from that repo is vendored.

| File | Source path | Size |
|---|---|---|
| `capybara.webp` | `assets/cards/capybara.jpg` | 10.6 KB |
| `crocodile.webp` | `assets/cards/crocodile.jpg` | 14.0 KB |
| `elephant.webp` | `assets/cards/elephant.jpg` | 12.2 KB |
| `flamingo.webp` | `assets/cards/flamingo.jpg` | 11.4 KB |
| `frame-capybara.webp` | `demo/motion-v7/cards/capybara.png` | 19.6 KB |
| `frame-elephant.webp` | `demo/motion-v7/cards/card_elephant.png` | 22.2 KB |
| `frame-giraffe.webp` | `demo/motion-v7/cards/card_giraffe.png` | 21.4 KB |
| `frame-orangutan.webp` | `demo/motion-v7/cards/card_orangutan.png` | 27.3 KB |
| `gibbon.webp` | `assets/cards/gibbon.jpg` | 14.8 KB |
| `giraffe.webp` | `assets/cards/giraffe.jpg` | 13.0 KB |
| `meerkat.webp` | `assets/cards/meerkat.jpg` | 10.7 KB |
| `orangutan.webp` | `assets/cards/orangutan.jpg` | 14.8 KB |
| `peacock.webp` | `assets/cards/peacock.jpg` | 16.0 KB |
| `pony.webp` | `assets/cards/pony.jpg` | 19.0 KB |
| `pygmyhippo.webp` | `assets/cards/pygmyhippo.jpg` | 12.3 KB |
| `raccoon.webp` | `assets/cards/raccoon.jpg` | 15.1 KB |
| `rhino.webp` | `assets/cards/rhino.jpg` | 13.2 KB |
| `sunbear.webp` | `assets/cards/sunbear.jpg` | 11.6 KB |
| `tiger.webp` | `assets/cards/tiger.jpg` | 16.9 KB |
| `tortoise.webp` | `assets/cards/tortoise.jpg` | 12.3 KB |

Total: **308.3 KB** (20 files).

Mapped in `src/lib/card-art.ts`. The pilot station `botanical-conservatory` has no animal painting, and B2B demo stamps (workshop, counter, window) are rooms, not animals. Those use the initial fallback card.
