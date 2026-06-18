import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  currentDirectionVector,
  directionFromReferenceAngle,
  formatAngle,
  physicsToScene,
  type DirectionInput,
} from '../utils/angleVector';

export interface StudentAmpere3DHandle {
  setZyView: () => void;
  setOrbitView: () => void;
}

interface StudentAmpere3DProps {
  input: DirectionInput;
  showAngles: boolean;
}

interface SceneRefs {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  dynamicGroup: THREE.Group;
}

const COLORS = {
  current: '#f6c945',
  magnetic: '#2ebac6',
  force: '#f25f4c',
  alpha: '#69b7ff',
  beta: '#ff9f6e',
  conductor: '#d6dde7',
  axis: '#9aa8b8',
  plane: '#263245',
  text: '#f8fbff',
};

const ZY_CAMERA = new THREE.Vector3(7, 0, 0);
const ORBIT_CAMERA = new THREE.Vector3(5.4, 3.2, -4.6);
const CAMERA_TARGET = new THREE.Vector3(0, 0, 0);
const STUDENT_SCENE_LABEL_SCALE = 4;
const LABEL_OFFSET_FACTOR = 2;
const LABEL_WORLD_OFFSET = 0.2 * LABEL_OFFSET_FACTOR;

export const StudentAmpere3D = forwardRef<StudentAmpere3DHandle, StudentAmpere3DProps>(function StudentAmpere3D(
  { input, showAngles },
  ref,
) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const refs = useRef<SceneRefs | null>(null);

  const vectors = useMemo(() => {
    const bPhysics = directionFromReferenceAngle(input.alphaDeg);
    const fPhysics = directionFromReferenceAngle(input.betaDeg);
    const iPhysics = currentDirectionVector(input.current);
    return {
      bPhysics,
      fPhysics,
      iPhysics,
      bScene: physicsToScene(bPhysics),
      fScene: physicsToScene(fPhysics),
      iScene: physicsToScene(iPhysics),
    };
  }, [input]);

  useImperativeHandle(ref, () => ({
    setZyView: () => setZyView(refs.current),
    setOrbitView: () => setOrbitView(refs.current),
  }));

  useEffect(() => {
    if (!hostRef.current) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x101821, 1);
    hostRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x101821, 9, 18);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.copy(ZY_CAMERA);
    camera.up.set(0, 1, 0);
    camera.lookAt(CAMERA_TARGET);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.copy(CAMERA_TARGET);
    controls.enablePan = false;
    controls.minDistance = 4;
    controls.maxDistance = 12;
    controls.enableRotate = false;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_ROTATE,
    };

    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(-4, 5, 4);
    scene.add(keyLight);

    const staticGroup = new THREE.Group();
    staticGroup.add(createReferenceGrid());
    staticGroup.add(createAxes());
    scene.add(staticGroup);

    const dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);

    refs.current = { renderer, scene, camera, controls, dynamicGroup };

    const resize = () => {
      if (!hostRef.current) return;
      const rect = hostRef.current.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(rect.height, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(hostRef.current);
    resize();

    let frameId = 0;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      disposeChildren(scene);
      renderer.domElement.remove();
      refs.current = null;
    };
  }, []);

  useEffect(() => {
    const sceneRefs = refs.current;
    if (!sceneRefs) return;

    clearGroup(sceneRefs.dynamicGroup);
    const group = createDynamicModel(input, vectors, showAngles);
    sceneRefs.dynamicGroup.add(group);
  }, [input, showAngles, vectors]);

  return (
    <div className="scene-card">
      <div ref={hostRef} className="scene-host" aria-label="安培力三维图示" />
      <div className="scene-readouts" aria-label="当前数据">
        <span>
          <span className="physics-symbol">I</span>: <span className="physics-symbol">{input.current}</span>
        </span>
        <span>
          <span className="physics-symbol">α</span> = {formatAngle(input.alphaDeg)}
        </span>
        <span>
          <span className="physics-symbol">β</span> = {formatAngle(input.betaDeg)}
        </span>
        <span>
          <span className="physics-symbol">{input.current}</span>
          {input.current === '+x' ? ' 指向观察者一侧' : ' 指向屏幕内侧'}
        </span>
      </div>
    </div>
  );
});

function setZyView(sceneRefs: SceneRefs | null) {
  if (!sceneRefs) return;
  sceneRefs.controls.enableRotate = false;
  sceneRefs.camera.position.copy(ZY_CAMERA);
  sceneRefs.camera.up.set(0, 1, 0);
  sceneRefs.controls.target.copy(CAMERA_TARGET);
  sceneRefs.camera.lookAt(CAMERA_TARGET);
  sceneRefs.controls.update();
}

function setOrbitView(sceneRefs: SceneRefs | null) {
  if (!sceneRefs) return;
  sceneRefs.controls.enableRotate = true;
  sceneRefs.camera.position.copy(ORBIT_CAMERA);
  sceneRefs.camera.up.set(0, 1, 0);
  sceneRefs.controls.target.copy(CAMERA_TARGET);
  sceneRefs.camera.lookAt(CAMERA_TARGET);
  sceneRefs.controls.update();
}

function createDynamicModel(input: DirectionInput, vectors: ReturnType<typeof directionBundle>, showAngles: boolean) {
  const group = new THREE.Group();

  group.add(createConductor(input.current));
  group.add(
    createArrow(new THREE.Vector3(0, 0, 0), vectors.iScene, 2.8, COLORS.current, 'I', {
      labelOffset: new THREE.Vector3(0, LABEL_WORLD_OFFSET * 1.8, LABEL_WORLD_OFFSET * 2.35),
      labelExtraDistance: 0.2,
    }),
  );
  group.add(
    createArrow(new THREE.Vector3(0, 0, 0), vectors.bScene, 2.55, COLORS.magnetic, 'B', {
      labelOffset: new THREE.Vector3(LABEL_WORLD_OFFSET * 0.35, -LABEL_WORLD_OFFSET * 0.35, LABEL_WORLD_OFFSET * 1.9),
      labelExtraDistance: 0.12,
    }),
  );
  group.add(
    createArrow(new THREE.Vector3(0, 0, 0), vectors.fScene, 2.25, COLORS.force, 'F_SUB_AMPERE', {
      labelOffset: new THREE.Vector3(0, -LABEL_WORLD_OFFSET * 0.95, -LABEL_WORLD_OFFSET * 0.95),
      labelExtraDistance: 0.34,
      labelScale: 0.3,
    }),
  );

  if (showAngles) {
    group.add(
      createAngleArc(input.alphaDeg, 0.82, COLORS.alpha, `α = ${formatAngle(input.alphaDeg)}`, new THREE.Vector3(0, 0.42, -0.18)),
    );
    group.add(
      createAngleArc(input.betaDeg, 1.12, COLORS.beta, `β = ${formatAngle(input.betaDeg)}`, new THREE.Vector3(0, 0.08, 0.48)),
    );
  }

  return group;
}

function directionBundle() {
  return {
    bPhysics: new THREE.Vector3(),
    fPhysics: new THREE.Vector3(),
    iPhysics: new THREE.Vector3(),
    bScene: new THREE.Vector3(),
    fScene: new THREE.Vector3(),
    iScene: new THREE.Vector3(),
  };
}

function createReferenceGrid() {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({ color: COLORS.plane, transparent: true, opacity: 0.75 });
  const size = 3;
  for (let index = -3; index <= 3; index += 1) {
    group.add(createLine([new THREE.Vector3(0, -size, index), new THREE.Vector3(0, size, index)], material));
    group.add(createLine([new THREE.Vector3(0, index, -size), new THREE.Vector3(0, index, size)], material));
  }
  return group;
}

function createAxes() {
  const group = new THREE.Group();
  group.add(createAxis(new THREE.Vector3(1, 0, 0), '+x', 3.15));
  group.add(createAxis(new THREE.Vector3(-1, 0, 0), '-x', 3.15));
  group.add(createAxis(new THREE.Vector3(0, 0, -1), '+y', 3.15));
  group.add(createAxis(new THREE.Vector3(0, 0, 1), '-y', 3.15));
  group.add(createAxis(new THREE.Vector3(0, 1, 0), '+z', 3.15));
  group.add(createAxis(new THREE.Vector3(0, -1, 0), '-z', 3.15));
  return group;
}

function createAxis(direction: THREE.Vector3, label: string, length: number) {
  const labelOffset = getAxisLabelOffset(label);
  return createArrow(new THREE.Vector3(0, 0, 0), direction, length, COLORS.axis, label, {
    shaftRadius: 0.018,
    headRadius: 0.055,
    labelOffset,
    labelScale: 0.26,
  });
}

function getAxisLabelOffset(label: string) {
  const offset = LABEL_WORLD_OFFSET;
  if (label === '+x') return new THREE.Vector3(0, offset * 1.15, offset * 1.35);
  if (label === '-x') return new THREE.Vector3(0, -offset * 1.15, -offset * 1.35);
  if (label === '+y') return new THREE.Vector3(0, offset * 0.55, -offset * 0.45);
  if (label === '-y') return new THREE.Vector3(0, offset * 0.55, offset * 0.45);
  if (label === '+z') return new THREE.Vector3(offset * 0.65, offset * 0.35, 0);
  if (label === '-z') return new THREE.Vector3(offset * 0.65, -offset * 0.35, 0);
  return new THREE.Vector3(0, 0, 0);
}

function createConductor(current: DirectionInput['current']) {
  const group = new THREE.Group();
  const geometry = new THREE.CylinderGeometry(0.08, 0.08, 4.7, 32);
  const material = new THREE.MeshStandardMaterial({ color: COLORS.conductor, metalness: 0.45, roughness: 0.32 });
  const conductor = new THREE.Mesh(geometry, material);
  conductor.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));
  group.add(conductor);

  return group;
}

function createArrow(
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  length: number,
  color: string,
  label: string,
  options: {
    labelLift?: number;
    shaftRadius?: number;
    headRadius?: number;
    labelOffset?: THREE.Vector3;
    labelScale?: number;
    labelExtraDistance?: number;
  } = {},
) {
  const group = new THREE.Group();
  const {
    labelLift = 0,
    shaftRadius = 0.045,
    headRadius = 0.13,
    labelOffset = new THREE.Vector3(0, 0, 0),
    labelScale = 0.34,
    labelExtraDistance = 0.62,
  } = options;
  const normalized = direction.clone().normalize();
  const shaftLength = Math.max(0.01, length - 0.3);
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftLength, 24),
    new THREE.MeshStandardMaterial({ color, roughness: 0.45 }),
  );
  shaft.position.copy(origin).add(normalized.clone().multiplyScalar(shaftLength / 2));
  shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normalized);
  group.add(shaft);

  const head = new THREE.Mesh(
    new THREE.ConeGeometry(headRadius, 0.34, 32),
    new THREE.MeshStandardMaterial({ color, roughness: 0.35 }),
  );
  head.position.copy(origin).add(normalized.clone().multiplyScalar(length - 0.14));
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normalized);
  group.add(head);

  const labelPosition = origin.clone().add(normalized.clone().multiplyScalar(length + labelExtraDistance)).add(labelOffset);
  labelPosition.y += labelLift;
  group.add(createTextSprite(label, color, labelPosition, labelScale));
  return group;
}

function createAngleArc(deg: number, radius: number, color: string, label: string, labelOffset: THREE.Vector3) {
  const group = new THREE.Group();
  const steps = Math.max(24, Math.ceil(Math.abs(deg) / 8));
  const points: THREE.Vector3[] = [];
  const end = THREE.MathUtils.degToRad(deg === 360 ? 359.8 : deg);
  for (let index = 0; index <= steps; index += 1) {
    const t = (end * index) / steps;
    points.push(new THREE.Vector3(0, Math.sin(t) * radius, -Math.cos(t) * radius));
  }
  const material = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  group.add(createLine(points, material));

  const mid = end / 2;
  const labelPosition = new THREE.Vector3(0, Math.sin(mid) * (radius + 0.72), -Math.cos(mid) * (radius + 0.72)).add(labelOffset);
  group.add(createTextSprite(label, color, labelPosition, 0.26));
  return group;
}

function createLine(points: THREE.Vector3[], material: THREE.Material) {
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
}

function createTextSprite(text: string, color: string, position: THREE.Vector3, scale = 0.3) {
  const canvas = document.createElement('canvas');
  canvas.width = text === 'F_SUB_AMPERE' ? 620 : 640;
  canvas.height = 160;
  const context = canvas.getContext('2d');
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.shadowColor = 'rgba(0, 0, 0, 0.65)';
    context.shadowBlur = 12;
    context.fillStyle = color;
    if (text === 'F_SUB_AMPERE') {
      drawForceSubscriptLabel(context, color, canvas.width, canvas.height);
    } else {
      context.font = 'italic 700 54px "Times New Roman", Times, serif';
      context.fillText(text, canvas.width / 2, canvas.height / 2);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(scale * 3.2 * STUDENT_SCENE_LABEL_SCALE, scale * STUDENT_SCENE_LABEL_SCALE, 1);
  return sprite;
}

function drawForceSubscriptLabel(context: CanvasRenderingContext2D, color: string, width: number, height: number) {
  const centerX = width / 2 - 38;
  const centerY = height / 2 - 4;
  context.fillStyle = color;
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.font = 'italic 700 74px "Times New Roman", Times, serif';
  context.fillText('F', centerX, centerY + 18);
  context.font = '700 28px "PingFang SC", "Microsoft YaHei", sans-serif';
  context.fillText('安培力', centerX + 55, centerY + 34);
}

function clearGroup(group: THREE.Group) {
  while (group.children.length > 0) {
    const child = group.children.pop();
    if (child) disposeChildren(child);
  }
}

function disposeChildren(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    const line = child as THREE.Line;
    const material = mesh.material ?? line.material;
    const geometry = mesh.geometry ?? line.geometry;
    if (geometry instanceof THREE.BufferGeometry) geometry.dispose();
    if (Array.isArray(material)) {
      material.forEach(disposeMaterial);
    } else if (material) {
      disposeMaterial(material);
    }
  });
}

function disposeMaterial(material: THREE.Material) {
  const spriteMaterial = material as THREE.SpriteMaterial;
  if (spriteMaterial.map) spriteMaterial.map.dispose();
  material.dispose();
}
