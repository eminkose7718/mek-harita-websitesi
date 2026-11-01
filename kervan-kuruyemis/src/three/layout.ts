/**
 * Store dimensions (metres). Derived from the storefront & interior reference photos:
 *  - Storefront ≈ 4 m wide, ground-floor glazing ≈ 3 m high, sign ≈ 3.85 × 1.39 m.
 *  - Narrow & long plan; interior depth (≈ 11 m) is an ASSUMPTION (not measurable from photos).
 * Coordinate system: x = right (when entering), y = up, z = toward the street.
 * Facade plane at z = 0, interior extends to negative z.
 */
export const DIM = {
  halfW: 1.9, // interior half width
  depth: 11,
  ceil: 3.0,
  doorHalf: 0.85,
  doorH: 2.55,
  signY0: 3.66,
  signH: 1.39,
  signW: 3.85,
  upperY0: 5.15,
  upperY1: 8.1,
};

export type Display = {
  productId: string;
  /** top-centre of the product surface */
  anchor: [number, number, number];
  /** direction from the product toward the viewer (aisle) */
  normal: [number, number, number];
  label: string;
};

// Right-hand wall: sloped bulk bins of dried fruit (as in the interior photo).
export const RIGHT_BINS = [
  "siyah-uzum",
  "kuru-erik",
  "gun-kurusu-kayisi",
  "kuru-kayisi",
  "kuru-uzum",
  "kuru-incir",
  "hurma",
] as const;
export const BIN_LEN = 0.98;
export const BIN_Z0 = -0.85;
export const BIN_X0 = 1.0;
export const BIN_X1 = 1.58;
export const BIN_TILT = 0.42; // radians, sloped toward the aisle

export const ANGLED_DISPLAY = ["antep-fistigi", "findik", "ceviz"] as const; // left side
export const ANGLED_Z0 = -4.9;
export const ANGLED_LEN = 0.82;

export const COUNTER_TRAYS = ["kaju", "badem", "karisik"] as const; // left back counter
export const COUNTER_Z0 = -7.75;
export const COUNTER_LEN = 0.78;

export const DISPLAYS: Display[] = [
  ...RIGHT_BINS.map((id, i) => ({
    productId: id,
    anchor: [(BIN_X0 + BIN_X1) / 2, 0.98, BIN_Z0 - BIN_LEN * (i + 0.5)] as [number, number, number],
    normal: [-0.85, 0.53, 0] as [number, number, number],
    label: id,
  })),
  ...ANGLED_DISPLAY.map((id, i) => ({
    productId: id,
    anchor: [-1.2, 0.98, ANGLED_Z0 - ANGLED_LEN * (i + 0.5)] as [number, number, number],
    normal: [0.85, 0.53, 0] as [number, number, number],
    label: id,
  })),
  ...COUNTER_TRAYS.map((id, i) => ({
    productId: id,
    anchor: [-1.15, 0.86, COUNTER_Z0 - COUNTER_LEN * (i + 0.5)] as [number, number, number],
    normal: [0.8, 0.6, 0] as [number, number, number],
    label: id,
  })),
];

export const displayFor = (id: string | null) => DISPLAYS.find((d) => d.productId === id) ?? null;

/** Walkable areas for Free Explore (camera never enters walls or counters). */
const INSIDE = { x0: -0.6, x1: 0.78, z0: -9.7, z1: -0.25 };
const DOORWAY = { x0: -0.6, x1: 0.6, z0: -0.4, z1: 0.75 };
const OUTSIDE = { x0: -4.2, x1: 4.2, z0: 0.65, z1: 9.5 };
const inRect = (r: typeof INSIDE, x: number, z: number) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
export const isWalkable = (x: number, z: number) => inRect(INSIDE, x, z) || inRect(DOORWAY, x, z) || inRect(OUTSIDE, x, z);

/** Slide along obstacles: try full move, then each axis separately. */
export function moveWithCollision(x: number, z: number, dx: number, dz: number): [number, number] {
  if (isWalkable(x + dx, z + dz)) return [x + dx, z + dz];
  if (isWalkable(x + dx, z)) return [x + dx, z];
  if (isWalkable(x, z + dz)) return [x, z + dz];
  return [x, z];
}

/** Nearest walkable point (used when entering Explore from an arbitrary camera position). */
export function nearestWalkable(x: number, z: number): [number, number] {
  if (isWalkable(x, z)) return [x, z];
  let best: [number, number] = [0, -1.2];
  let bd = Infinity;
  for (const r of [INSIDE, DOORWAY, OUTSIDE]) {
    const cx = Math.min(r.x1, Math.max(r.x0, x));
    const cz = Math.min(r.z1, Math.max(r.z0, z));
    const d = (cx - x) ** 2 + (cz - z) ** 2;
    if (d < bd) {
      bd = d;
      best = [cx, cz];
    }
  }
  return best;
}
