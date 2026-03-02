/**
 * Geo Utilities
 * Haversine formula for calculating the great-circle distance
 * between two points on the Earth's surface.
 */

/** Earth's mean radius in kilometres */
const EARTH_RADIUS_KM = 6_371;

/** Convert degrees to radians */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

/**
 * Calculate the great-circle distance between two geographic
 * points using the Haversine formula.
 *
 * @returns Distance in **kilometres**, rounded to 2 decimal places.
 */
export function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);

  const sinHalfDLat = Math.sin(dLat / 2);
  const sinHalfDLng = Math.sin(dLng / 2);

  const h =
    sinHalfDLat * sinHalfDLat +
    Math.cos(toRadians(a.lat)) *
      Math.cos(toRadians(b.lat)) *
      sinHalfDLng *
      sinHalfDLng;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return Math.round(EARTH_RADIUS_KM * c * 100) / 100;
}

/**
 * Find the nearest point from `candidates` to a given `origin`.
 * Returns the candidate and the distance in km.
 */
export function findNearest<T extends GeoPoint>(
  origin: GeoPoint,
  candidates: T[],
): { point: T; distanceKm: number } | null {
  if (candidates.length === 0) return null;

  let nearest = candidates[0];
  let minDist = haversineDistanceKm(origin, nearest);

  for (let i = 1; i < candidates.length; i++) {
    const dist = haversineDistanceKm(origin, candidates[i]);
    if (dist < minDist) {
      minDist = dist;
      nearest = candidates[i];
    }
  }

  return { point: nearest, distanceKm: minDist };
}
