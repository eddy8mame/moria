/** Parsed bounding box in [west, south, east, north] order (EPSG:4326). */
export type Bbox = [west: number, south: number, east: number, north: number];

/**
 * Parse a comma-separated bbox string into validated coordinates.
 * Expects "west,south,east,north" (lon/lat order, matching GeoJSON and MapLibre conventions).
 * Returns null if the input is missing, malformed, or out of WGS84 bounds.
 */
export function parseBbox(raw: string | null): Bbox | null {
    if (!raw) return null;

    const parts = raw.split(',').map(Number);
    if (parts.length !== 4 || parts.some(Number.isNaN)) return null;

    const [west, south, east, north] = parts;

    if (west < -180 || east > 180 || south < -90 || north > 90) return null;
    if (west >= east || south >= north) return null;

    return [west, south, east, north];
}
