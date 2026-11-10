import { windowFor, type CrmActivityInput, type CrmPerson } from "./aggregate";

const STAMPS = ["kiosk", "plush", "blocks", "train", "robot", "cube"] as const;
const STATION_NAMES = ["Demo Kiosk", "Demo Plush", "Demo Blocks", "Demo Train", "Robot Racer", "Puzzle Cube"];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Same shape as the demo-toy-studio seed: 40 visitors across 30 days. */
export function demoActivity(now = new Date("2026-11-10T03:00:00.000Z")): { input: CrmActivityInput; people: CrmPerson[] } {
  const range = windowFor("Asia/Ho_Chi_Minh", 30, now);
  const rand = mulberry32(20261110);
  const people: CrmPerson[] = [];
  const taps: CrmActivityInput["taps"] = [];
  const grants: CrmActivityInput["grants"] = [];
  const holdings: CrmActivityInput["holdings"] = [];
  const owned = new Map<string, Set<string>>();

  for (let i = 1; i <= 40; i += 1) {
    const id = `visitor-${String(i).padStart(2, "0")}`;
    const person: CrmPerson = {
      id,
      displayName: `Demo visitor ${String(i).padStart(2, "0")}`,
      email: `demo-visitor-${String(i).padStart(2, "0")}@example.com`,
      locale: i % 2 === 0 ? "vi" : "en",
      lastAt: null,
    };
    people.push(person);
    const set = new Set<string>();
    owned.set(id, set);
    const goal = i <= 8 ? STAMPS.length : (i % 4) + 1;
    for (let day = 0; day < 30; day += 1) {
      if ((i * 5 + day * 3) % 4 !== 0 && !(day % 7 === 0 && i % 3 === 0)) continue;
      const at = new Date(Date.UTC(2026, 9, 12, 2, 15) + day * 86400000 + Math.floor(rand() * 8) * 3600000);
      const unowned = STAMPS.filter((stamp) => !set.has(stamp));
      const stampId = set.size < goal && unowned.length > 0 ? unowned[day % unowned.length]! : STAMPS[(i + day) % STAMPS.length]!;
      const stationName = STATION_NAMES[STAMPS.indexOf(stampId as (typeof STAMPS)[number])] ?? "Demo Kiosk";
      const granted = !set.has(stampId);
      taps.push({
        at: at.toISOString(),
        participantId: id,
        stationName,
        source: (i + day) % 5 === 0 ? "qr" : "nfc",
        granted,
      });
      if (granted) {
        set.add(stampId);
        grants.push({
          at: at.toISOString(),
          participantId: id,
          stampId,
          stampName: stationName,
          stationName,
          source: (i + day) % 5 === 0 ? "qr" : "nfc",
        });
        holdings.push({ participantId: id, stampId });
      }
      person.lastAt = at.toISOString();
    }
  }

  return {
    people,
    input: {
      timeZone: "Asia/Ho_Chi_Minh",
      from: range.from,
      to: range.to,
      taps,
      grants,
      holdings,
      activeStampIds: [...STAMPS],
    },
  };
}
