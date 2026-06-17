import * as THREE from 'three';

export type CurrentDirection = '+x' | '-x';

export interface DirectionInput {
  current: CurrentDirection;
  alphaDeg: number;
  betaDeg: number;
}

export function clampAngleInput(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(360, Math.max(0, value));
}

export function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

export function directionFromReferenceAngle(deg: number) {
  const rad = degToRad(deg);
  return new THREE.Vector3(0, Math.cos(rad), Math.sin(rad)).normalize();
}

export function currentDirectionVector(current: CurrentDirection) {
  return new THREE.Vector3(current === '+x' ? 1 : -1, 0, 0);
}

export function physicsToScene(vector: THREE.Vector3) {
  return new THREE.Vector3(vector.x, vector.z, -vector.y);
}

export function angleBetweenDeg(a: THREE.Vector3, b: THREE.Vector3) {
  const dot = THREE.MathUtils.clamp(a.clone().normalize().dot(b.clone().normalize()), -1, 1);
  return radToDeg(Math.acos(dot));
}

export function formatAngle(value: number) {
  return `${value.toFixed(1)}°`;
}
