type GouacheAnimal = "capybara" | "elephant" | "giraffe" | "orangutan";

type GouacheArtProps = {
  animal: GouacheAnimal;
  pastel: string;
};

export function GouacheArt({ animal, pastel }: GouacheArtProps) {
  return (
    <svg
      viewBox="0 0 200 230"
      className="h-full w-full"
      aria-hidden="true"
    >
      <rect width="200" height="230" fill={pastel} />
      <ellipse cx="100" cy="196" rx="62" ry="10" fill="#2c221e" opacity="0.08" />
      {animal === "capybara" ? <Capybara /> : null}
      {animal === "elephant" ? <Elephant /> : null}
      {animal === "giraffe" ? <Giraffe /> : null}
      {animal === "orangutan" ? <Orangutan /> : null}
    </svg>
  );
}

function Capybara() {
  return (
    <g>
      <path d="M78 86c18-28 48-20 54-4 8 4 18 22 8 36H70c-8-12-6-22 8-32z" fill="#d97724" />
      <ellipse cx="96" cy="142" rx="58" ry="36" fill="#c9894a" />
      <ellipse cx="128" cy="112" rx="34" ry="28" fill="#d7a15d" />
      <ellipse cx="112" cy="96" rx="10" ry="8" fill="#a86b38" />
      <ellipse cx="146" cy="92" rx="8" ry="7" fill="#a86b38" />
      <circle cx="138" cy="108" r="3.5" fill="#2c221e" />
      <ellipse cx="156" cy="118" rx="7" ry="5" fill="#e7b7a2" />
      <path d="M70 150h28c2 8 8 14 16 14h18c-2 10-16 16-28 12-14-4-28-10-34-26z" fill="#f4e1b5" />
      <path d="M86 158h22" stroke="#d97724" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function Elephant() {
  return (
    <g>
      <ellipse cx="108" cy="140" rx="52" ry="40" fill="#7f9a90" />
      <circle cx="132" cy="104" r="28" fill="#8eaaa0" />
      <ellipse cx="108" cy="112" rx="16" ry="22" fill="#6e8b81" />
      <path d="M146 112c16 8 22 28 14 46-4 8-8 8-12 2 6-14 4-28-6-36-6-4-10-12 4-12z" fill="#9bb5ab" />
      <circle cx="140" cy="100" r="3.5" fill="#2c221e" />
      <path d="M92 168c8 10 22 12 34 6 4-2 8 2 6 6-16 8-36 4-48-8 0-6 4-8 8-4z" fill="#f2c98a" />
      <path d="M118 78l8 16h-16z" fill="#d97724" />
    </g>
  );
}

function Giraffe() {
  return (
    <g>
      <path d="M118 168c-8-36-6-78 2-104 4 28 10 62 8 104h-10z" fill="#e2b15a" />
      <circle cx="124" cy="62" r="18" fill="#efc36d" />
      <circle cx="130" cy="58" r="3" fill="#2c221e" />
      <path d="M112 48l14-16 14 16-6 4h-16z" fill="#f4e894" />
      <circle cx="112" cy="96" r="5" fill="#d97724" />
      <circle cx="124" cy="118" r="4" fill="#d97724" />
      <circle cx="116" cy="146" r="5" fill="#d97724" />
      <ellipse cx="96" cy="172" rx="28" ry="16" fill="#e2b15a" />
    </g>
  );
}

function Orangutan() {
  return (
    <g>
      <ellipse cx="100" cy="150" rx="46" ry="34" fill="#d86a32" />
      <circle cx="116" cy="108" r="26" fill="#e48955" />
      <ellipse cx="96" cy="112" rx="10" ry="12" fill="#f0c2a4" />
      <circle cx="124" cy="104" r="3.5" fill="#2c221e" />
      <path d="M62 132c-10 16-6 32 8 36 8-12 10-24 6-36h-14z" fill="#c4552a" />
      <path d="M138 128c14 6 22 20 16 32-10-6-16-16-16-32z" fill="#c4552a" />
      <rect x="124" y="146" width="14" height="26" rx="6" fill="#f7f1e4" />
      <rect x="127" y="150" width="8" height="14" rx="3" fill="#8fd0c2" />
      <path d="M108 86c10-16 24-12 26 0-10 2-20 0-26 0z" fill="#6f42c1" />
    </g>
  );
}
