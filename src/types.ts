export type Vec3 = [number, number, number];

export type ShapeType = "box" | "cylinder" | "sphere" | "cone" | "torus" | "mac-mini";
export type ShapeOperation = "add" | "cut";
export type ShapeRole = "solid" | "reference";

export interface ShapeDimensions {
  width: number;
  height: number;
  depth: number;
  radius: number;
  radiusTop: number;
  radiusBottom: number;
  tube: number;
}

export interface ModelShape {
  id: string;
  name: string;
  type: ShapeType;
  role: ShapeRole;
  operation: ShapeOperation;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  dimensions: ShapeDimensions;
  visible: boolean;
  locked: boolean;
}

export interface ModelProject {
  id: string;
  name: string;
  unit: "mm";
  color: string;
  roughness: number;
  metalness: number;
  buildVolume: Vec3;
  shapes: ModelShape[];
  updatedAt: string;
}

export type CheckLevel = "pass" | "warning" | "error";

export interface GeometryCheck {
  id: string;
  label: string;
  level: CheckLevel;
  detail: string;
}

export interface ModelReport {
  printable: boolean;
  dimensions: Vec3;
  bounds: {
    min: Vec3;
    max: Vec3;
  };
  triangleCount: number;
  boundaryEdges: number;
  checks: GeometryCheck[];
  geometryError?: string;
}

export type EditAction =
  | { kind: "add"; shape: Partial<ModelShape> & { type: ShapeType } }
  | { kind: "update"; id: string; patch: Partial<ModelShape> }
  | { kind: "remove"; id: string }
  | { kind: "duplicate"; id: string }
  | { kind: "set-appearance"; color?: string; roughness?: number; metalness?: number }
  | { kind: "rename-project"; name: string };

export interface ActivityEntry {
  id: string;
  source: "You" | "Codex" | "System";
  title: string;
  detail: string;
  timestamp: string;
}

export interface ToolFeedback {
  id: string;
  severity: "note" | "problem";
  toolName: string;
  message: string;
  timestamp: string;
}

export type CameraPreset = "isometric" | "front" | "right" | "top";

export interface CaptureOptions {
  view: CameraPreset;
  width?: number;
  height?: number;
  transparent?: boolean;
}

export interface CaptureResult {
  dataUrl: string;
  width: number;
  height: number;
  view: CameraPreset;
}
