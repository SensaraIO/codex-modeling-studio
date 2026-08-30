import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  ADDITION,
  Brush,
  Evaluator,
  SUBTRACTION,
} from "three-bvh-csg";
import type {
  EditAction,
  GeometryCheck,
  ModelProject,
  ModelReport,
  ModelShape,
  ShapeDimensions,
  ShapeType,
  Vec3,
} from "../types";

const DEFAULT_DIMENSIONS: ShapeDimensions = {
  width: 40,
  height: 40,
  depth: 40,
  radius: 20,
  radiusTop: 10,
  radiusBottom: 20,
  tube: 6,
};

const now = () => new Date().toISOString();

export function makeId(prefix = "shape") {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

export function makeShape(type: ShapeType, patch: Partial<ModelShape> = {}): ModelShape {
  const labels: Record<ShapeType, string> = {
    box: "Box",
    cylinder: "Cylinder",
    sphere: "Sphere",
    cone: "Cone",
    torus: "Torus",
    vase: "Vase",
    "mac-mini": "Mac mini reference",
  };

  return {
    id: patch.id ?? makeId(),
    name: patch.name ?? labels[type],
    type,
    role: patch.role ?? "solid",
    operation: patch.operation ?? "add",
    position: patch.position ?? [0, 20, 0],
    rotation: patch.rotation ?? [0, 0, 0],
    scale: patch.scale ?? [1, 1, 1],
    dimensions: { ...DEFAULT_DIMENSIONS, ...patch.dimensions },
    visible: patch.visible ?? true,
    locked: patch.locked ?? false,
  };
}

export const starterProject: ModelProject = {
  id: "minimal-modern-vase",
  name: "Minimal modern vase",
  unit: "mm",
  color: "#eee9df",
  roughness: 0.78,
  metalness: 0,
  buildVolume: [256, 256, 256],
  updatedAt: now(),
  shapes: [
    makeShape("vase", {
      id: "vase-body",
      name: "Bone ceramic vase",
      position: [0, 0, 0],
      dimensions: {
        ...DEFAULT_DIMENSIONS,
        height: 150,
        radius: 50,
        radiusTop: 17,
        tube: 4,
      },
    }),
  ],
};

export function cloneProject(project: ModelProject): ModelProject {
  return structuredClone(project);
}

function sanitizeVec3(value: unknown, fallback: Vec3): Vec3 {
  if (!Array.isArray(value) || value.length !== 3) return fallback;
  const next = value.map(Number);
  if (next.some((item) => !Number.isFinite(item))) return fallback;
  return next as Vec3;
}

function sanitizeShape(shape: ModelShape): ModelShape {
  const dimensions = Object.fromEntries(
    Object.entries(shape.dimensions).map(([key, value]) => [
      key,
      Math.max(0.1, Number.isFinite(Number(value)) ? Number(value) : 1),
    ]),
  ) as unknown as ShapeDimensions;

  return {
    ...shape,
    role: shape.role === "reference" ? "reference" : "solid",
    name: String(shape.name || "Untitled shape").slice(0, 80),
    position: sanitizeVec3(shape.position, [0, 0, 0]),
    rotation: sanitizeVec3(shape.rotation, [0, 0, 0]),
    scale: sanitizeVec3(shape.scale, [1, 1, 1]).map((value) => Math.max(0.01, value)) as Vec3,
    dimensions,
  };
}

export function applyEditActions(project: ModelProject, actions: EditAction[]): ModelProject {
  let next = cloneProject(project);

  for (const action of actions) {
    if (action.kind === "add") {
      const shape = makeShape(action.shape.type, action.shape);
      next.shapes.push(sanitizeShape(shape));
      continue;
    }

    if (action.kind === "update") {
      next.shapes = next.shapes.map((shape) => {
        if (shape.id !== action.id || shape.locked) return shape;
        const merged = {
          ...shape,
          ...action.patch,
          id: shape.id,
          dimensions: { ...shape.dimensions, ...action.patch.dimensions },
        };
        return sanitizeShape(merged);
      });
      continue;
    }

    if (action.kind === "remove") {
      next.shapes = next.shapes.filter((shape) => shape.id !== action.id || shape.locked);
      continue;
    }

    if (action.kind === "duplicate") {
      const source = next.shapes.find((shape) => shape.id === action.id);
      if (source) {
        next.shapes.push(
          sanitizeShape({
            ...structuredClone(source),
            id: makeId(),
            name: `${source.name} copy`,
            position: [source.position[0] + 8, source.position[1], source.position[2] + 8],
            locked: false,
          }),
        );
      }
      continue;
    }

    if (action.kind === "set-appearance") {
      if (action.color && /^#[0-9a-f]{6}$/i.test(action.color)) next.color = action.color;
      if (action.roughness !== undefined) next.roughness = THREE.MathUtils.clamp(action.roughness, 0, 1);
      if (action.metalness !== undefined) next.metalness = THREE.MathUtils.clamp(action.metalness, 0, 1);
      continue;
    }

    if (action.kind === "rename-project") {
      next.name = action.name.trim().slice(0, 80) || next.name;
    }
  }

  next.updatedAt = now();
  return next;
}

export function createPrimitiveGeometry(shape: ModelShape): THREE.BufferGeometry {
  const d = shape.dimensions;
  switch (shape.type) {
    case "box":
      return new THREE.BoxGeometry(d.width, d.depth, d.height, 1, 1, 1);
    case "cylinder":
      return new THREE.CylinderGeometry(d.radius, d.radius, d.height, 64, 1, false).rotateX(Math.PI / 2);
    case "sphere":
      return new THREE.SphereGeometry(d.radius, 64, 32);
    case "cone":
      return new THREE.CylinderGeometry(d.radiusTop, d.radiusBottom, d.height, 64, 1, false).rotateX(Math.PI / 2);
    case "torus":
      return new THREE.TorusGeometry(d.radius, d.tube, 24, 64);
    case "vase": {
      const height = d.height;
      const bellyRadius = d.radius;
      const neckRadius = Math.min(d.radiusTop, bellyRadius * 0.72);
      const wall = Math.min(d.tube, neckRadius * 0.72, bellyRadius * 0.22);
      const baseThickness = Math.min(Math.max(wall * 1.35, height * 0.028), height * 0.12);
      const bodyCurve = new THREE.CubicBezierCurve(
        new THREE.Vector2(bellyRadius * 0.7, 0),
        new THREE.Vector2(bellyRadius * 0.74, height * 0.04),
        new THREE.Vector2(bellyRadius, height * 0.3),
        new THREE.Vector2(bellyRadius, height * 0.56),
      );
      const shoulderCurve = new THREE.CubicBezierCurve(
        new THREE.Vector2(bellyRadius, height * 0.56),
        new THREE.Vector2(bellyRadius, height * 0.72),
        new THREE.Vector2(neckRadius, height * 0.82),
        new THREE.Vector2(neckRadius, height * 0.9),
      );
      const neckCurve = new THREE.CubicBezierCurve(
        new THREE.Vector2(neckRadius, height * 0.9),
        new THREE.Vector2(neckRadius, height * 0.93),
        new THREE.Vector2(neckRadius, height * 0.98),
        new THREE.Vector2(neckRadius, height),
      );
      const outer = [
        ...bodyCurve.getPoints(24),
        ...shoulderCurve.getPoints(18).slice(1),
        ...neckCurve.getPoints(8).slice(1),
      ];
      const inner = outer
        .filter((point) => point.y >= baseThickness)
        .reverse()
        .map((point) => new THREE.Vector2(Math.max(0.8, point.x - wall), point.y));
      const profile = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(outer[0].x, 0),
        ...outer.slice(1),
        ...inner,
        new THREE.Vector2(0, baseThickness),
      ];
      return createRevolvedGeometry(profile, 96);
    }
    case "mac-mini":
      return new RoundedBoxGeometry(d.width, d.depth, d.height, 5, Math.min(9, d.height * 0.18));
  }
}

function createRevolvedGeometry(profile: THREE.Vector2[], segments: number) {
  const positions: number[] = [];
  const indices: number[] = [];
  const rings = profile.map((point) => {
    if (point.x <= 0.0001) {
      const index = positions.length / 3;
      positions.push(0, 0, point.y);
      return [index];
    }

    const ring: number[] = [];
    for (let segment = 0; segment < segments; segment += 1) {
      const angle = segment / segments * Math.PI * 2;
      ring.push(positions.length / 3);
      positions.push(point.x * Math.cos(angle), point.x * Math.sin(angle), point.y);
    }
    return ring;
  });

  for (let profileIndex = 0; profileIndex < rings.length - 1; profileIndex += 1) {
    const current = rings[profileIndex];
    const next = rings[profileIndex + 1];
    for (let segment = 0; segment < segments; segment += 1) {
      const following = (segment + 1) % segments;
      if (current.length === 1) {
        indices.push(current[0], next[following], next[segment]);
      } else if (next.length === 1) {
        indices.push(current[segment], current[following], next[0]);
      } else {
        indices.push(
          current[segment], current[following], next[segment],
          current[following], next[following], next[segment],
        );
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createReferenceObject(shape: ModelShape) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    createPrimitiveGeometry(shape),
    new THREE.MeshStandardMaterial({ color: "#c5c7cb", roughness: 0.3, metalness: 0.72 }),
  );
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  if (shape.type === "mac-mini") {
    const d = shape.dimensions;
    const underside = new THREE.Mesh(
      new RoundedBoxGeometry(d.width * 0.9, d.depth * 0.9, 3, 3, 1.5),
      new THREE.MeshStandardMaterial({ color: "#17181b", roughness: 0.7, metalness: 0.15 }),
    );
    underside.position.z = -d.height / 2 + 1.3;
    group.add(underside);

    const portMaterial = new THREE.MeshStandardMaterial({ color: "#202125", roughness: 0.8 });
    const usbGeometry = new RoundedBoxGeometry(7, 1.2, 3.2, 2, 1);
    for (const x of [-30, -18]) {
      const port = new THREE.Mesh(usbGeometry.clone(), portMaterial.clone());
      port.position.set(x, -d.depth / 2 - 0.35, -10);
      group.add(port);
    }
    const jack = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 1.2, 20),
      portMaterial.clone(),
    );
    jack.position.set(31, -d.depth / 2 - 0.4, -10);
    group.add(jack);
  }

  group.position.set(...shape.position);
  group.rotation.set(
    THREE.MathUtils.degToRad(shape.rotation[0]),
    THREE.MathUtils.degToRad(shape.rotation[1]),
    THREE.MathUtils.degToRad(shape.rotation[2]),
  );
  group.scale.set(...shape.scale);
  group.userData.shapeId = shape.id;
  return group;
}

export function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => material.dispose());
  });
}

function brushFromShape(shape: ModelShape) {
  const geometry = createPrimitiveGeometry(shape);
  const brush = new Brush(geometry);
  brush.position.set(...shape.position);
  brush.rotation.set(
    THREE.MathUtils.degToRad(shape.rotation[0]),
    THREE.MathUtils.degToRad(shape.rotation[1]),
    THREE.MathUtils.degToRad(shape.rotation[2]),
  );
  brush.scale.set(...shape.scale);
  brush.updateMatrixWorld(true);
  return brush;
}

export interface CompositeGeometryResult {
  geometry: THREE.BufferGeometry | null;
  error?: string;
}

export function buildCompositeGeometry(shapes: ModelShape[]): CompositeGeometryResult {
  const visible = shapes.filter((shape) => shape.visible && shape.role !== "reference");
  const firstAddIndex = visible.findIndex((shape) => shape.operation === "add");
  if (firstAddIndex < 0) return { geometry: null, error: "The model needs at least one additive shape." };

  const ordered = visible.slice(firstAddIndex);
  let result = brushFromShape(ordered[0]);
  const evaluator = new Evaluator();
  evaluator.attributes = ["position", "normal"];
  evaluator.useGroups = false;

  try {
    for (const shape of ordered.slice(1)) {
      const operand = brushFromShape(shape);
      result = evaluator.evaluate(
        result,
        operand,
        shape.operation === "cut" ? SUBTRACTION : ADDITION,
      );
    }

    result.updateMatrixWorld(true);
    const geometry = result.geometry.clone();
    geometry.applyMatrix4(result.matrixWorld);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return { geometry };
  } catch (error) {
    return {
      geometry: null,
      error: error instanceof Error ? error.message : "The boolean geometry operation failed.",
    };
  }
}

function tuple(vector: THREE.Vector3): Vec3 {
  return [
    Number(vector.x.toFixed(2)),
    Number(vector.y.toFixed(2)),
    Number(vector.z.toFixed(2)),
  ];
}

function countBoundaryEdges(geometry: THREE.BufferGeometry) {
  const position = geometry.getAttribute("position");
  if (!position) return 0;
  const edgeCounts = new Map<string, number>();
  const precision = 10_000;
  const vertexKey = (index: number) =>
    `${Math.round(position.getX(index) * precision)},${Math.round(position.getY(index) * precision)},${Math.round(position.getZ(index) * precision)}`;
  const addEdge = (a: number, b: number) => {
    const ka = vertexKey(a);
    const kb = vertexKey(b);
    if (ka === kb) return;
    const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
    edgeCounts.set(key, (edgeCounts.get(key) ?? 0) + 1);
  };

  const index = geometry.index;
  const count = index ? index.count : position.count;
  for (let i = 0; i < count; i += 3) {
    const a = index ? index.getX(i) : i;
    const b = index ? index.getX(i + 1) : i + 1;
    const c = index ? index.getX(i + 2) : i + 2;
    addEdge(a, b);
    addEdge(b, c);
    addEdge(c, a);
  }

  return [...edgeCounts.values()].filter((value) => value !== 2).length;
}

export function validateProject(project: ModelProject): ModelReport {
  const checks: GeometryCheck[] = [];
  const active = project.shapes.filter((shape) => shape.visible && shape.role !== "reference");
  const additive = active.filter((shape) => shape.operation === "add");
  const invalidDimensions = active.filter((shape) =>
    Object.values(shape.dimensions).some((value) => !Number.isFinite(value) || value <= 0),
  );

  checks.push({
    id: "solid-base",
    label: "Solid base",
    level: additive.length ? "pass" : "error",
    detail: additive.length
      ? `${additive.length} additive ${additive.length === 1 ? "shape defines" : "shapes define"} the body.`
      : "Add at least one solid before using cut shapes.",
  });

  checks.push({
    id: "dimensions",
    label: "Positive dimensions",
    level: invalidDimensions.length ? "error" : "pass",
    detail: invalidDimensions.length
      ? `${invalidDimensions.length} shapes contain an invalid dimension.`
      : "Every active parameter is greater than zero.",
  });

  const composite = buildCompositeGeometry(project.shapes);
  if (!composite.geometry || composite.error) {
    checks.push({
      id: "boolean-result",
      label: "Boolean result",
      level: "error",
      detail: composite.error ?? "No geometry was produced.",
    });
    return {
      printable: false,
      dimensions: [0, 0, 0],
      bounds: { min: [0, 0, 0], max: [0, 0, 0] },
      triangleCount: 0,
      boundaryEdges: 0,
      checks,
      geometryError: composite.error,
    };
  }

  const geometry = composite.geometry;
  geometry.computeBoundingBox();
  const box = geometry.boundingBox ?? new THREE.Box3();
  const size = box.getSize(new THREE.Vector3());
  const min = box.min;
  const max = box.max;
  const dimensions = tuple(size);
  const triangleCount = geometry.index
    ? Math.floor(geometry.index.count / 3)
    : Math.floor((geometry.getAttribute("position")?.count ?? 0) / 3);
  const boundaryEdges = countBoundaryEdges(geometry);
  const fits = dimensions.every((value, index) => value <= project.buildVolume[index]);
  const onBed = Math.abs(min.z) <= 0.25;
  const belowBed = min.z < -0.25;

  checks.push({
    id: "boolean-result",
    label: "Boolean result",
    level: "pass",
    detail: `Generated ${triangleCount.toLocaleString()} triangles from ${active.length} active ${active.length === 1 ? "shape" : "shapes"}.`,
  });
  checks.push({
    id: "build-volume",
    label: "Build volume",
    level: fits ? "pass" : "error",
    detail: fits
      ? `${dimensions.join(" × ")} mm fits within ${project.buildVolume.join(" × ")} mm.`
      : `${dimensions.join(" × ")} mm exceeds the configured build volume.`,
  });
  checks.push({
    id: "bed-contact",
    label: "Bed contact",
    level: belowBed ? "error" : onBed ? "pass" : "warning",
    detail: belowBed
      ? `Geometry extends ${Math.abs(min.z).toFixed(2)} mm below the print bed.`
      : onBed
        ? "The lowest face meets Z0 in the modeling coordinate system."
        : `The model begins ${min.z.toFixed(2)} mm above the print bed.`,
  });
  checks.push({
    id: "mesh-edges",
    label: "Closed mesh",
    level: boundaryEdges === 0 ? "pass" : "warning",
    detail: boundaryEdges === 0
      ? "Every mesh edge has a matching neighbor."
      : `${boundaryEdges.toLocaleString()} mesh edges need slicer review after export.`,
  });

  geometry.dispose();
  const printable = !checks.some((check) => check.level === "error");
  return {
    printable,
    dimensions,
    bounds: { min: tuple(min), max: tuple(max) },
    triangleCount,
    boundaryEdges,
    checks,
  };
}

export function describeActions(actions: EditAction[]) {
  const counts = new Map<string, number>();
  actions.forEach((action) => counts.set(action.kind, (counts.get(action.kind) ?? 0) + 1));
  return [...counts.entries()]
    .map(([kind, count]) => `${count} ${kind.replace("-", " ")}`)
    .join(", ");
}
