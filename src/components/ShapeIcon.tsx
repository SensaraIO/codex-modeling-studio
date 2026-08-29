import {
  Box,
  Circle,
  Cone,
  Cylinder,
  Monitor,
  Orbit,
} from "lucide-react";
import type { ShapeType } from "../types";

export function ShapeIcon({ type, size = 15 }: { type: ShapeType; size?: number }) {
  if (type === "mac-mini") return <Monitor size={size} />;
  if (type === "box") return <Box size={size} />;
  if (type === "cylinder") return <Cylinder size={size} />;
  if (type === "sphere") return <Circle size={size} />;
  if (type === "cone") return <Cone size={size} />;
  return <Orbit size={size} />;
}
