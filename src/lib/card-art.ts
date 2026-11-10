/**
 * Painted cards from dongnnh2112work/tap-tap, keyed so a station slug,
 * stamp slug, or display name can resolve the same file.
 * See public/cards/SOURCES.md.
 */
export type CardArt = {
  animal: string;
  /** Full painted card (white frame, blank nameplate). */
  src: string;
  /** Higher-resolution painted card when the prototype shipped one. */
  frameSrc?: string;
};

const ART = {
  elephant: {
    animal: "elephant",
    src: "/cards/elephant.webp",
    frameSrc: "/cards/frame-elephant.webp",
  },
  giraffe: {
    animal: "giraffe",
    src: "/cards/giraffe.webp",
    frameSrc: "/cards/frame-giraffe.webp",
  },
  capybara: {
    animal: "capybara",
    src: "/cards/capybara.webp",
    frameSrc: "/cards/frame-capybara.webp",
  },
  orangutan: {
    animal: "orangutan",
    src: "/cards/orangutan.webp",
    frameSrc: "/cards/frame-orangutan.webp",
  },
  meerkat: { animal: "meerkat", src: "/cards/meerkat.webp" },
  sunbear: { animal: "sunbear", src: "/cards/sunbear.webp" },
  raccoon: { animal: "raccoon", src: "/cards/raccoon.webp" },
  rhino: { animal: "rhino", src: "/cards/rhino.webp" },
  tiger: { animal: "tiger", src: "/cards/tiger.webp" },
  gibbon: { animal: "gibbon", src: "/cards/gibbon.webp" },
  flamingo: { animal: "flamingo", src: "/cards/flamingo.webp" },
  peacock: { animal: "peacock", src: "/cards/peacock.webp" },
  crocodile: { animal: "crocodile", src: "/cards/crocodile.webp" },
  tortoise: { animal: "tortoise", src: "/cards/tortoise.webp" },
  pony: { animal: "pony", src: "/cards/pony.webp" },
  pygmyhippo: { animal: "pygmyhippo", src: "/cards/pygmyhippo.webp" },
} as const satisfies Record<string, CardArt>;

export type CardAnimal = keyof typeof ART;

const ALIASES: Record<string, CardAnimal> = {
  elephant: "elephant",
  "asian-elephant": "elephant",
  "asian elephant": "elephant",
  "demo elephant": "elephant",
  "voi chau a": "elephant",
  "bread elephant": "elephant",
  "voi banh mi": "elephant",
  giraffe: "giraffe",
  "giraffe-lookout": "giraffe",
  "demo giraffe": "giraffe",
  "huou cao co": "giraffe",
  "leaf hat": "giraffe",
  "huou non la": "giraffe",
  capybara: "capybara",
  "capy chill": "capybara",
  orangutan: "orangutan",
  "duoi uoi": "orangutan",
  "sugarcane ape": "orangutan",
  meerkat: "meerkat",
  sunbear: "sunbear",
  "sun bear": "sunbear",
  "gau cho": "sunbear",
  raccoon: "raccoon",
  "gau meo": "raccoon",
  rhino: "rhino",
  "te giac": "rhino",
  tiger: "tiger",
  "ho bengal": "tiger",
  gibbon: "gibbon",
  "vuon ma vang": "gibbon",
  flamingo: "flamingo",
  "flamingo-lagoon": "flamingo",
  "hong hac": "flamingo",
  peacock: "peacock",
  cong: "peacock",
  crocodile: "crocodile",
  "ca sau": "crocodile",
  tortoise: "tortoise",
  "rua sulcata": "tortoise",
  pony: "pony",
  "ngua lun": "pony",
  pygmyhippo: "pygmyhippo",
  "ha ma lun": "pygmyhippo",
  "pygmy hippo": "pygmyhippo",
};

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** First matching slug or name wins. Returns null when we have no painting. */
export function resolveCardArt(
  ...keys: Array<string | null | undefined>
): CardArt | null {
  for (const key of keys) {
    if (!key) continue;
    const folded = fold(key);
    const alias = ALIASES[folded] ?? ALIASES[folded.replace(/ /g, "-")];
    if (alias) return ART[alias];
    if (folded in ART) return ART[folded as CardAnimal];
  }
  return null;
}

export function cardArtSrc(art: CardArt, preferFrame = false): string {
  return preferFrame && art.frameSrc ? art.frameSrc : art.src;
}
