export function normalizeAngle(value: number) {
  if (!Number.isFinite(value)) return 0;
  return ((value % 360) + 360) % 360;
}

export function isNear(value: number, target: number, tolerance: number) {
  return Math.abs(value - target) <= tolerance;
}
