export interface GeoPoint {
  lat: number;
  lng: number;
}

import type { SupportedLocale } from "@/types/database.types";

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

/**
 * Center of Saigon Zoo & Botanical Gardens (Thảo Cầm Viên Sài Gòn).
 */
export const SAIGON_ZOO_CENTER: GeoCoordinates = {
  lat: 10.7883,
  lng: 106.7054,
};

/**
 * Waypoints along the Saigon Zoo Explorer walking trail for live GPS simulation.
 * Starts near the Main Gate and walks through all 4 checkpoints:
 * Main Gate -> Asian Elephant -> Botanical Conservatory -> Flamingo Lagoon -> Giraffe Lookout
 */
export const SAIGON_ZOO_DEMO_TRAIL: GeoCoordinates[] = [
  { lat: 10.7868, lng: 106.7052 },
  { lat: 10.787, lng: 106.70515 },
  { lat: 10.7872, lng: 106.7051 }, // #1 Asian Elephant
  { lat: 10.7876, lng: 106.70495 },
  { lat: 10.7881, lng: 106.7048 }, // #2 Botanical Conservatory
  { lat: 10.78835, lng: 106.70545 },
  { lat: 10.7886, lng: 106.7061 }, // #3 Flamingo Lagoon
  { lat: 10.78905, lng: 106.70585 },
  { lat: 10.7895, lng: 106.7056 }, // #4 Giraffe Lookout
];

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates the great-circle distance in meters between two GPS coordinates
 * using the Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lng1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lng2)
  ) {
    return 0;
  }

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Formats a distance in meters into a concise badge string (e.g. "45m" or "1.2km").
 */
export function formatDistance(
  meters: number,
  locale: SupportedLocale = "en"
): string {
  const safeMeters = Math.max(0, Math.round(meters));
  if (safeMeters < 1000) {
    return `${safeMeters}m`;
  }
  const km = safeMeters / 1000;
  const formattedKm = new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    minimumFractionDigits: km < 10 ? 1 : 0,
    maximumFractionDigits: 1,
  }).format(km);
  return `${formattedKm}km`;
}

/**
 * Builds a Google Maps walking directions URL to a destination coordinate.
 */
export function getWalkingDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
}
