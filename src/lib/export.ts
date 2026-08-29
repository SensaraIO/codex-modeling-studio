import * as THREE from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import type { ModelProject } from "../types";
import { buildCompositeGeometry, validateProject } from "./model";

export interface ExportResult {
  ok: boolean;
  filename?: string;
  bytes?: number;
  message: string;
}

function fileSafeName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "model";
}

export function createStlBlob(project: ModelProject): { blob: Blob; filename: string } | null {
  const composite = buildCompositeGeometry(project.shapes);
  if (!composite.geometry) return null;

  const exporter = new STLExporter();
  const mesh = new THREE.Mesh(composite.geometry, new THREE.MeshBasicMaterial());
  mesh.updateMatrixWorld(true);
  const binary = exporter.parse(mesh, { binary: true });
  const bytes = new Uint8Array(binary.buffer, binary.byteOffset, binary.byteLength);
  const blob = new Blob([bytes], { type: "model/stl" });
  composite.geometry.dispose();
  return { blob, filename: `${fileSafeName(project.name)}.stl` };
}

export function downloadStl(project: ModelProject): ExportResult {
  const report = validateProject(project);
  if (!report.printable) {
    const errors = report.checks.filter((check) => check.level === "error");
    return {
      ok: false,
      message: `Export blocked: ${errors.map((check) => check.detail).join(" ")}`,
    };
  }

  const result = createStlBlob(project);
  if (!result) return { ok: false, message: "Export blocked because no geometry was produced." };

  const url = URL.createObjectURL(result.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = result.filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);

  return {
    ok: true,
    filename: result.filename,
    bytes: result.blob.size,
    message: `Downloaded ${result.filename}.`,
  };
}
