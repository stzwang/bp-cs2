// Radar calibration for converting CS2 world coordinates → normalized [0,1] minimap space.
//
// Each map's standard 1024×1024 radar is defined by the top-left world corner
// (posX, posY) and `scale` (world units per pixel), taken from the map's overview .txt.
//   pixelX = (worldX - posX) / scale
//   pixelY = (posY - worldY) / scale      (y is flipped: world +y is "up", pixels go down)
// Dividing by 1024 yields a resolution-independent 0..1 coordinate we can drop onto
// any sized minimap (and onto a radar PNG at /public/maps/<key>.png if present).
//
// Values are approximate to the current competitive map versions; if a radar image is
// added and dots look offset, tweak posX/posY/scale for that map here.

export interface MapCalibration {
  posX: number;
  posY: number;
  scale: number;
  /** Optional radar background; looked up at /maps/<key>.png by default. */
  radar?: string;
}

const RADAR_PX = 1024;

export const MAP_CALIBRATION: Record<string, MapCalibration> = {
  dust2: { posX: -2476, posY: 3239, scale: 4.4 },
  mirage: { posX: -3230, posY: 1713, scale: 5.0 },
  nuke: { posX: -3453, posY: 2887, scale: 7.0 },
  inferno: { posX: -2087, posY: 3870, scale: 4.9 },
  overpass: { posX: -4831, posY: 1781, scale: 5.2 },
  ancient: { posX: -2953, posY: 2164, scale: 5.0 },
  anubis: { posX: -2796, posY: 3328, scale: 5.22 },
  vertigo: { posX: -3168, posY: 1762, scale: 4.0 },
  train: { posX: -2308, posY: 2078, scale: 4.082 },
};

export function normalizeMapName(name: string): string {
  return name.toLowerCase().replace(/^de_/, "").trim();
}

export function radarUrl(mapName: string): string {
  return `/maps/${normalizeMapName(mapName)}.png`;
}

/**
 * Convert world (x, y) to normalized minimap coordinates in [0,1].
 * Returns null if the map has no calibration. Values may fall slightly outside
 * [0,1] for off-radar positions; callers can clamp for display.
 */
export function worldToNormalized(
  mapName: string,
  x: number,
  y: number
): { nx: number; ny: number } | null {
  const calib = MAP_CALIBRATION[normalizeMapName(mapName)];
  if (!calib) return null;
  const nx = (x - calib.posX) / calib.scale / RADAR_PX;
  const ny = (calib.posY - y) / calib.scale / RADAR_PX;
  return { nx, ny };
}

export function hasCalibration(mapName: string): boolean {
  return normalizeMapName(mapName) in MAP_CALIBRATION;
}
