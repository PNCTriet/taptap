import React from "react";

export type StationArtworkKey =
  | "asian-elephant"
  | "botanical-conservatory"
  | "flamingo-lagoon"
  | "giraffe-lookout"
  | "saigon-zoo-hero";

export type StationIllustrationVariant = "card" | "stamp" | "avatar";

export interface StationIllustrationProps {
  stationIdOrSlug: string;
  variant?: StationIllustrationVariant;
  className?: string;
  grayscale?: boolean;
}

/**
 * Resolves any station UUID, slug, or collection identifier to one of the 5
 * cohesive Playful Explorer illustration keys.
 */
export function resolveArtworkKey(idOrSlug: string): StationArtworkKey {
  const normalized = (idOrSlug || "").trim().toLowerCase();

  if (
    normalized === "33333333-3333-4333-8333-333333333301" ||
    normalized === "55555555-5555-4555-8555-555555555501" ||
    normalized === "tcv-k9x2m4p8" ||
    normalized.includes("elephant")
  ) {
    return "asian-elephant";
  }

  if (
    normalized === "33333333-3333-4333-8333-333333333302" ||
    normalized === "55555555-5555-4555-8555-555555555502" ||
    normalized === "tcv-b7n4q1w6" ||
    normalized.includes("botanical") ||
    normalized.includes("conservatory")
  ) {
    return "botanical-conservatory";
  }

  if (
    normalized === "33333333-3333-4333-8333-333333333303" ||
    normalized === "55555555-5555-4555-8555-555555555503" ||
    normalized === "tcv-m3p9x5r2" ||
    normalized.includes("flamingo") ||
    normalized.includes("lagoon")
  ) {
    return "flamingo-lagoon";
  }

  if (
    normalized === "33333333-3333-4333-8333-333333333304" ||
    normalized === "55555555-5555-4555-8555-555555555504" ||
    normalized === "tcv-w2v8k6j4" ||
    normalized.includes("giraffe") ||
    normalized.includes("lookout")
  ) {
    return "giraffe-lookout";
  }

  return "saigon-zoo-hero";
}

/**
 * Multi-layered vector illustration library in the unified Playful Explorer style:
 * Palette:
 * - Explorer Teal: #176B61 / #0E433D / #248F82 / #E6F3F1
 * - Sunshine Yellow: #F2C653 / #FCE8A6 / #D9A326
 * - Adventure Coral: #F07861 / #F8A494 / #DE634C
 * - Discovery Blue: #4D73CF / #84A4F0 / #EAF0FB
 * - Paper Cream & Ink: #FFF8EB / #272E2B
 */
export function StationIllustration({
  stationIdOrSlug,
  variant = "card",
  className = "",
  grayscale = false,
}: StationIllustrationProps) {
  const key = resolveArtworkKey(stationIdOrSlug);

  const aspectClass =
    variant === "avatar"
      ? "aspect-square rounded-2xl"
      : variant === "stamp"
      ? "aspect-[4/3]"
      : "aspect-[4/3]";

  return (
    <div
      data-testid={`station-artwork-${key}`}
      className={`relative overflow-hidden select-none ${aspectClass} ${
        grayscale ? "grayscale opacity-65" : ""
      } ${className}`.trim()}
    >
      {key === "asian-elephant" && <AsianElephantSvg />}
      {key === "botanical-conservatory" && <BotanicalConservatorySvg />}
      {key === "flamingo-lagoon" && <FlamingoLagoonSvg />}
      {key === "giraffe-lookout" && <GiraffeLookoutSvg />}
      {key === "saigon-zoo-hero" && <SaigonZooHeroSvg />}
    </div>
  );
}

function AsianElephantSvg() {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full object-cover"
      role="img"
      aria-label="Asian Elephant illustration"
    >
      {/* Warm Cream & Soft Teal Sky Backdrop */}
      <rect width="400" height="300" fill="#E6F3F1" />
      <circle cx="322" cy="68" r="46" fill="#F2C653" fillOpacity="0.88" />
      <circle cx="322" cy="68" r="62" fill="#F2C653" fillOpacity="0.22" />

      {/* Heritage Arch Silhouette in Background */}
      <path
        d="M52 240V116C52 68 92 34 142 34C192 34 232 68 232 116V240"
        stroke="#176B61"
        strokeOpacity="0.18"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M72 240V122C72 84 103 54 142 54C181 54 212 84 212 122V240"
        stroke="#176B61"
        strokeOpacity="0.12"
        strokeWidth="4"
        strokeDasharray="6 6"
      />

      {/* Distant Rolling Canopy Hills */}
      <path
        d="M-20 228C48 186 135 190 212 218C284 244 345 202 420 216V300H-20V228Z"
        fill="#248F82"
        fillOpacity="0.32"
      />
      <path
        d="M-20 250C68 220 168 224 268 248C332 262 374 246 420 242V300H-20V250Z"
        fill="#176B61"
      />

      {/* Tropical Canopy Leaves (Top Left & Right) */}
      <path
        d="M0 0H126C110 42 74 72 24 84L0 90V0Z"
        fill="#176B61"
      />
      <path
        d="M18 0C36 28 66 48 106 54C78 72 42 78 0 72V0H18Z"
        fill="#248F82"
      />
      <path
        d="M400 18C354 26 320 56 306 96C344 92 378 74 400 48V18Z"
        fill="#176B61"
        fillOpacity="0.85"
      />

      {/* Sculpted Asian Elephant Body */}
      {/* Back Legs */}
      <rect x="114" y="188" width="30" height="68" rx="14" fill="#12564E" />
      <rect x="204" y="192" width="28" height="64" rx="13" fill="#12564E" />

      {/* Torso */}
      <rect x="98" y="114" width="144" height="98" rx="46" fill="#176B61" />

      {/* Ceremonial Saddle Blanket in Sunshine Yellow & Coral */}
      <path
        d="M134 114H202V162C202 174 192 184 180 184H156C144 184 134 174 134 162V114Z"
        fill="#F07861"
      />
      <path
        d="M144 114H192V154C192 162 185 168 177 168H159C151 168 144 162 144 154V114Z"
        fill="#F2C653"
      />
      <circle cx="168" cy="140" r="8" fill="#FFF8EB" />

      {/* Front Legs + Toenails */}
      <rect x="132" y="184" width="32" height="74" rx="15" fill="#176B61" />
      <rect x="220" y="184" width="32" height="74" rx="15" fill="#176B61" />
      <circle cx="140" cy="252" r="4" fill="#FFF8EB" />
      <circle cx="150" cy="252" r="4" fill="#FFF8EB" />
      <circle cx="228" cy="252" r="4" fill="#FFF8EB" />
      <circle cx="238" cy="252" r="4" fill="#FFF8EB" />

      {/* Tail */}
      <path
        d="M99 144C82 154 76 174 78 194"
        stroke="#12564E"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="78" cy="197" r="6" fill="#0E433D" />

      {/* Head & Raised Playful Trunk */}
      <circle cx="248" cy="134" r="42" fill="#176B61" />
      <path
        d="M276 128C298 128 314 112 316 92C318 76 308 66 298 68C290 70 288 80 294 86C298 90 296 102 282 104"
        stroke="#176B61"
        strokeWidth="22"
        strokeLinecap="round"
      />

      {/* Ear */}
      <path
        d="M206 104C186 104 176 124 182 148C187 168 208 176 224 164C236 155 236 104 206 104Z"
        fill="#0E433D"
      />
      <path
        d="M208 114C194 114 188 128 192 144C195 157 209 162 219 154"
        fill="#F07861"
        fillOpacity="0.45"
      />

      {/* Eye & Cheek */}
      <circle cx="264" cy="122" r="4.5" fill="#272E2B" />
      <circle cx="265.5" cy="120.5" r="1.5" fill="#FFF8EB" />
      <circle cx="256" cy="136" r="7" fill="#F07861" fillOpacity="0.55" />

      {/* Ivory Tusk */}
      <path
        d="M268 148C284 154 300 148 308 136C296 136 282 138 272 140Z"
        fill="#FFF8EB"
        stroke="#272E2B"
        strokeWidth="2"
      />

      {/* Water Drops from Trunk */}
      <circle cx="304" cy="48" r="4" fill="#4D73CF" />
      <circle cx="318" cy="54" r="3" fill="#4D73CF" />
      <circle cx="290" cy="56" r="3" fill="#4D73CF" />

      {/* Foreground Botanical Fronds */}
      <path
        d="M36 280C44 252 68 238 92 242C72 258 58 272 52 292Z"
        fill="#F2C653"
      />
      <path
        d="M332 284C340 256 364 242 388 246C368 262 354 276 348 296Z"
        fill="#F2C653"
      />
    </svg>
  );
}

function BotanicalConservatorySvg() {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full object-cover"
      role="img"
      aria-label="Botanical Conservatory illustration"
    >
      {/* Warm Sunlit Cream Sky */}
      <rect width="400" height="300" fill="#FDF6DF" />

      {/* Golden Sunburst Rays */}
      <circle cx="200" cy="148" r="118" fill="#F2C653" fillOpacity="0.28" />
      <circle cx="200" cy="148" r="88" fill="#F2C653" fillOpacity="0.45" />

      {/* Victorian Glasshouse Dome & Ribs */}
      <path
        d="M76 248V154C76 88 131 38 200 38C269 38 324 88 324 154V248H76Z"
        fill="#FFFDF8"
        stroke="#176B61"
        strokeWidth="6"
      />
      {/* Glass Arch Mullions */}
      <path
        d="M126 248V148C126 96 159 52 200 38C241 52 274 96 274 148V248"
        stroke="#176B61"
        strokeWidth="3.5"
        strokeOpacity="0.55"
      />
      <line
        x1="200"
        y1="24"
        x2="200"
        y2="248"
        stroke="#176B61"
        strokeWidth="4"
      />
      <line
        x1="76"
        y1="152"
        x2="324"
        y2="152"
        stroke="#176B61"
        strokeWidth="3.5"
        strokeOpacity="0.55"
      />
      <line
        x1="92"
        y1="104"
        x2="308"
        y2="104"
        stroke="#176B61"
        strokeWidth="3"
        strokeOpacity="0.4"
      />
      {/* Finial Spire */}
      <circle cx="200" cy="24" r="7" fill="#F07861" stroke="#176B61" strokeWidth="3" />

      {/* Lush Tropical Monstera & Ferns Inside Dome */}
      <path
        d="M114 248C112 194 146 146 196 132C194 186 164 228 114 248Z"
        fill="#176B61"
      />
      <path
        d="M286 248C288 194 254 146 204 132C206 186 236 228 286 248Z"
        fill="#248F82"
      />
      <path
        d="M154 248C154 184 176 122 200 94C224 122 246 184 246 248H154Z"
        fill="#12564E"
      />

      {/* Blooming Golden & Coral Orchids */}
      <g transform="translate(200, 146)">
        <circle cx="0" cy="-18" r="14" fill="#F07861" />
        <circle cx="-17" cy="-5" r="14" fill="#F07861" />
        <circle cx="17" cy="-5" r="14" fill="#F07861" />
        <circle cx="-11" cy="14" r="13" fill="#DE634C" />
        <circle cx="11" cy="14" r="13" fill="#DE634C" />
        <circle cx="0" cy="0" r="9" fill="#F2C653" />
        <circle cx="0" cy="0" r="4" fill="#FFF8EB" />
      </g>

      <g transform="translate(142, 188) scale(0.75)">
        <circle cx="0" cy="-16" r="12" fill="#F2C653" />
        <circle cx="-15" cy="-4" r="12" fill="#F2C653" />
        <circle cx="15" cy="-4" r="12" fill="#F2C653" />
        <circle cx="-9" cy="12" r="11" fill="#D9A326" />
        <circle cx="9" cy="12" r="11" fill="#D9A326" />
        <circle cx="0" cy="0" r="7" fill="#F07861" />
      </g>

      <g transform="translate(258, 188) scale(0.75)">
        <circle cx="0" cy="-16" r="12" fill="#F2C653" />
        <circle cx="-15" cy="-4" r="12" fill="#F2C653" />
        <circle cx="15" cy="-4" r="12" fill="#F2C653" />
        <circle cx="-9" cy="12" r="11" fill="#D9A326" />
        <circle cx="9" cy="12" r="11" fill="#D9A326" />
        <circle cx="0" cy="0" r="7" fill="#F07861" />
      </g>

      {/* Terracotta & Teal Base Terrace */}
      <rect x="44" y="246" width="312" height="18" rx="9" fill="#176B61" />
      <rect x="0" y="262" width="400" height="38" fill="#0E433D" />
    </svg>
  );
}

function FlamingoLagoonSvg() {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full object-cover"
      role="img"
      aria-label="Flamingo Lagoon illustration"
    >
      {/* Soft Coral-Tinted Morning Sky */}
      <rect width="400" height="300" fill="#FDECE8" />
      <circle cx="88" cy="72" r="42" fill="#F2C653" />

      {/* Distant Lagoon Palms */}
      <path
        d="M-10 192C64 166 144 174 220 188C296 202 350 176 410 184V220H-10V192Z"
        fill="#176B61"
        fillOpacity="0.24"
      />

      {/* Rippling Turquoise Lagoon Water */}
      <rect x="0" y="196" width="400" height="104" fill="#176B61" />
      <path
        d="M0 212C70 202 130 222 200 212C270 202 330 222 400 212V300H0V212Z"
        fill="#12564E"
      />

      {/* Water Ripples */}
      <rect x="112" y="242" width="148" height="5" rx="2.5" fill="#FFF8EB" fillOpacity="0.45" />
      <rect x="142" y="258" width="96" height="4" rx="2" fill="#FFF8EB" fillOpacity="0.3" />
      <rect x="252" y="232" width="84" height="4" rx="2" fill="#F2C653" fillOpacity="0.5" />

      {/* Floating Emerald Lotus Pads & Lotus Blossom */}
      <ellipse cx="86" cy="244" rx="34" ry="11" fill="#248F82" />
      <path d="M86 244L118 238L118 250Z" fill="#12564E" />
      <ellipse cx="322" cy="252" rx="38" ry="12" fill="#248F82" />
      <path
        d="M322 232C328 240 328 248 322 252C316 248 316 240 322 232Z"
        fill="#F07861"
      />
      <path
        d="M312 236C320 240 322 248 322 252C314 250 310 244 312 236Z"
        fill="#F8A494"
      />
      <path
        d="M332 236C324 240 322 248 322 252C330 250 334 244 332 236Z"
        fill="#F8A494"
      />

      {/* Graceful Primary Flamingo */}
      {/* Long Coral Legs */}
      <line x1="184" y1="168" x2="184" y2="246" stroke="#F07861" strokeWidth="5.5" strokeLinecap="round" />
      <path
        d="M198 168L214 206L180 212"
        stroke="#F07861"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Sculpted Flamingo Body & Wing */}
      <path
        d="M138 156C138 130 164 118 196 122C222 125 236 144 230 162C224 178 198 184 168 180C148 177 138 168 138 156Z"
        fill="#F07861"
      />
      {/* Tail Feathers */}
      <path
        d="M142 148C124 152 114 166 116 180C128 176 142 168 148 158Z"
        fill="#DE634C"
      />
      {/* Layered Wing */}
      <path
        d="M158 136C180 132 206 140 214 156C198 168 172 168 156 154C152 148 152 138 158 136Z"
        fill="#F8A494"
      />
      <path
        d="M166 144C182 142 198 148 204 158C190 164 174 162 166 144Z"
        fill="#272E2B"
        fillOpacity="0.85"
      />

      {/* S-Curve Neck & Head */}
      <path
        d="M216 138C236 120 242 84 226 62C216 48 206 46 218 44"
        stroke="#F07861"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <circle cx="222" cy="52" r="14" fill="#F07861" />
      {/* Iconic Hooked Beak (Cream + Ink Tip) */}
      <path
        d="M232 48C248 48 256 58 252 70L240 66L232 56Z"
        fill="#FFF8EB"
      />
      <path d="M245 61L252 70L240 66Z" fill="#272E2B" />
      <circle cx="224" cy="50" r="3" fill="#272E2B" />

      {/* Companion Flamingo Silhouette in Background */}
      <g opacity="0.85" transform="translate(56, 18) scale(0.78)">
        <line x1="252" y1="180" x2="252" y2="250" stroke="#DE634C" strokeWidth="5" />
        <ellipse cx="248" cy="166" rx="34" ry="22" fill="#DE634C" />
        <path
          d="M272 156C286 136 288 106 276 90"
          stroke="#DE634C"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <circle cx="276" cy="86" r="11" fill="#DE634C" />
        <path d="M284 84C295 84 300 92 297 100L286 96Z" fill="#272E2B" />
      </g>
    </svg>
  );
}

function GiraffeLookoutSvg() {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full object-cover"
      role="img"
      aria-label="Giraffe Lookout illustration"
    >
      {/* Discovery Blue & Golden Savanna Sky */}
      <rect width="400" height="300" fill="#EAF0FB" />
      <circle cx="104" cy="82" r="52" fill="#F2C653" />
      <circle cx="104" cy="82" r="72" fill="#F2C653" fillOpacity="0.25" />

      {/* Savanna Horizon Hills */}
      <path
        d="M-10 232C78 198 164 206 254 226C320 240 368 220 410 214V300H-10V232Z"
        fill="#4D73CF"
        fillOpacity="0.22"
      />
      <path
        d="M-10 256C94 232 212 238 318 258C362 266 390 258 410 252V300H-10V256Z"
        fill="#176B61"
      />

      {/* Acacia Tree Canopy on Left */}
      <path
        d="M64 260V146L34 114M64 166L96 132"
        stroke="#272E2B"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <rect x="6" y="96" width="96" height="24" rx="12" fill="#176B61" />
      <rect x="44" y="116" width="84" height="20" rx="10" fill="#248F82" />
      <rect x="22" y="76" width="76" height="18" rx="9" fill="#12564E" />

      {/* Tall Sculpted Giraffe Looking Over the Deck */}
      {/* Long Neck & Body */}
      <path
        d="M212 300L238 112L278 118L268 300H212Z"
        fill="#F2C653"
      />
      {/* Mane along Back of Neck */}
      <path
        d="M268 122L260 288"
        stroke="#D9A326"
        strokeWidth="8"
        strokeDasharray="10 8"
        strokeLinecap="round"
      />

      {/* Characteristic Giraffe Coat Spots (Coral / Warm Terracotta) */}
      <circle cx="246" cy="148" r="9" fill="#F07861" />
      <circle cx="234" cy="176" r="11" fill="#DE634C" />
      <circle cx="252" cy="204" r="10" fill="#F07861" />
      <circle cx="230" cy="232" r="13" fill="#DE634C" />
      <circle cx="250" cy="260" r="11" fill="#F07861" />
      <circle cx="226" cy="276" r="9" fill="#F07861" />

      {/* Giraffe Head, Ears & Ossicones (Horns) */}
      <line x1="244" y1="82" x2="240" y2="56" stroke="#272E2B" strokeWidth="5" strokeLinecap="round" />
      <circle cx="240" cy="54" r="6" fill="#272E2B" />
      <line x1="262" y1="84" x2="268" y2="58" stroke="#272E2B" strokeWidth="5" strokeLinecap="round" />
      <circle cx="268" cy="56" r="6" fill="#272E2B" />

      {/* Ears */}
      <ellipse cx="282" cy="92" rx="14" ry="7" transform="rotate(-20 282 92)" fill="#D9A326" />
      <ellipse cx="224" cy="90" rx="12" ry="6" transform="rotate(20 224 90)" fill="#D9A326" />

      {/* Head & Snout */}
      <path
        d="M204 96C204 82 222 76 248 76C268 76 280 88 278 106C276 120 260 126 236 124C214 122 204 110 204 96Z"
        fill="#F2C653"
      />
      <path
        d="M204 98C204 90 214 86 226 88V122C212 120 204 110 204 98Z"
        fill="#F07861"
        fillOpacity="0.65"
      />
      {/* Friendly Eye */}
      <circle cx="244" cy="96" r="5" fill="#272E2B" />
      <circle cx="245.5" cy="94.5" r="1.8" fill="#FFF8EB" />
      {/* Nostril */}
      <circle cx="214" cy="98" r="2.5" fill="#272E2B" />

      {/* Lookout Wooden Deck Railing in Foreground */}
      <rect x="0" y="274" width="400" height="10" fill="#272E2B" fillOpacity="0.18" />
    </svg>
  );
}

function SaigonZooHeroSvg() {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full object-cover"
      role="img"
      aria-label="Saigon Zoo Explorer Passport Crest"
    >
      <rect width="400" height="300" fill="#176B61" />

      {/* Subtle Compass Grid */}
      <circle
        cx="200"
        cy="150"
        r="122"
        stroke="#FFF8EB"
        strokeOpacity="0.14"
        strokeWidth="2"
        strokeDasharray="6 6"
      />
      <circle
        cx="200"
        cy="150"
        r="96"
        fill="#FFF8EB"
        stroke="#F2C653"
        strokeWidth="6"
      />

      {/* 4 Quadrant Motifs Inside the Crest */}
      {/* Top-Left: Asian Elephant Teal Leaf */}
      <circle cx="164" cy="116" r="26" fill="#E6F3F1" />
      <path
        d="M152 124C152 110 162 102 174 106C180 108 184 102 184 96"
        stroke="#176B61"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="162" cy="116" r="10" fill="#176B61" />

      {/* Top-Right: Botanical Conservatory Dome */}
      <circle cx="236" cy="116" r="26" fill="#FDF6DF" />
      <path
        d="M222 128V114C222 104 228 98 236 98C244 98 250 104 250 114V128H222Z"
        fill="#F2C653"
        stroke="#176B61"
        strokeWidth="3"
      />

      {/* Bottom-Left: Flamingo Coral Emblem */}
      <circle cx="164" cy="184" r="26" fill="#FDECE8" />
      <path
        d="M154 190C154 182 162 178 170 182C176 176 176 168 170 166"
        stroke="#F07861"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <ellipse cx="162" cy="188" rx="10" ry="7" fill="#F07861" />

      {/* Bottom-Right: Giraffe Golden Emblem */}
      <circle cx="236" cy="184" r="26" fill="#EAF0FB" />
      <path
        d="M230 202L238 168L246 170L242 202H230Z"
        fill="#F2C653"
      />
      <circle cx="242" cy="170" r="6" fill="#F07861" />

      {/* Center Compass Star */}
      <circle cx="200" cy="150" r="16" fill="#176B61" stroke="#FFF8EB" strokeWidth="4" />
      <circle cx="200" cy="150" r="5" fill="#F2C653" />

      {/* Corner Tropical Leaves */}
      <path d="M0 0H88C72 34 42 58 0 68V0Z" fill="#0E433D" />
      <path d="M400 300H312C328 266 358 242 400 232V300Z" fill="#0E433D" />
    </svg>
  );
}

/**
 * Generates an inline HTML/SVG string for Leaflet `L.divIcon` markers so every
 * station pin on the GPS map renders its matching cohesive animal emblem, station
 * number, and collected/selected state.
 */
export function getStationPinHtml(
  stationIdOrSlug: string,
  options: {
    sortOrder: number;
    collected: boolean;
    selected: boolean;
  }
): string {
  const key = resolveArtworkKey(stationIdOrSlug);
  const { sortOrder, collected, selected } = options;

  const ringColor = collected ? "#176B61" : selected ? "#F07861" : "#272E2B";
  const badgeBg = collected ? "#F2C653" : "#176B61";
  const badgeText = collected ? "#272E2B" : "#FFFFFF";
  const scaleStyle = selected ? "transform: scale(1.16);" : "transform: scale(1);";

  let miniGlyphSvg = "";
  if (key === "asian-elephant") {
    miniGlyphSvg = `<svg viewBox="0 0 40 40" width="28" height="28" fill="none">
      <circle cx="20" cy="20" r="18" fill="#E6F3F1"/>
      <ellipse cx="18" cy="22" rx="10" ry="8" fill="#176B61"/>
      <circle cx="26" cy="18" r="6" fill="#176B61"/>
      <path d="M30 18C33 18 35 14 33 11" stroke="#176B61" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="27" cy="17" r="1.3" fill="#FFF8EB"/>
    </svg>`;
  } else if (key === "botanical-conservatory") {
    miniGlyphSvg = `<svg viewBox="0 0 40 40" width="28" height="28" fill="none">
      <circle cx="20" cy="20" r="18" fill="#FDF6DF"/>
      <path d="M10 29V19C10 13.5 14.5 9 20 9C25.5 9 30 13.5 30 19V29H10Z" fill="#FFFDF8" stroke="#176B61" stroke-width="2.5"/>
      <circle cx="20" cy="20" r="4.5" fill="#F07861"/>
      <circle cx="20" cy="20" r="2" fill="#F2C653"/>
    </svg>`;
  } else if (key === "flamingo-lagoon") {
    miniGlyphSvg = `<svg viewBox="0 0 40 40" width="28" height="28" fill="none">
      <circle cx="20" cy="20" r="18" fill="#FDECE8"/>
      <ellipse cx="18" cy="23" rx="8" ry="5.5" fill="#F07861"/>
      <path d="M24 21C27 17 27 12 24 10" stroke="#F07861" stroke-width="3.2" stroke-linecap="round"/>
      <circle cx="24" cy="10" r="3" fill="#F07861"/>
      <path d="M26 10L29 12L26 12Z" fill="#272E2B"/>
    </svg>`;
  } else {
    miniGlyphSvg = `<svg viewBox="0 0 40 40" width="28" height="28" fill="none">
      <circle cx="20" cy="20" r="18" fill="#EAF0FB"/>
      <path d="M16 32L20 13L25 14L23 32H16Z" fill="#F2C653"/>
      <ellipse cx="19" cy="13" rx="5.5" ry="3.8" fill="#F2C653"/>
      <circle cx="21" cy="20" r="2" fill="#F07861"/>
      <circle cx="19" cy="26" r="2.2" fill="#DE634C"/>
    </svg>`;
  }

  return `
    <div style="position:relative;width:48px;height:54px;display:flex;flex-direction:column;align-items:center;transition:transform 200ms cubic-bezier(0.34,1.56,0.64,1);${scaleStyle}">
      ${
        selected
          ? `<span style="position:absolute;top:-4px;width:52px;height:52px;border-radius:9999px;background:rgba(240,120,97,0.22);animation:inkRingPulse 1.4s infinite;"></span>`
          : ""
      }
      <div style="position:relative;width:44px;height:44px;border-radius:9999px;background:#FFFDF8;border:3px solid ${ringColor};box-shadow:0 6px 16px rgba(39,46,43,0.22);display:flex;align-items:center;justify-content:center;">
        ${miniGlyphSvg}
        <span style="position:absolute;top:-5px;right:-5px;min-width:19px;height:19px;padding:0 4px;border-radius:9999px;background:${badgeBg};color:${badgeText};border:2px solid #FFFDF8;font-family:monospace;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;">
          ${collected ? "✓" : `#${sortOrder}`}
        </span>
      </div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${ringColor};margin-top:-1px;"></div>
    </div>
  `;
}
