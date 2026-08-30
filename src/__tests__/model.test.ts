import { describe, expect, it } from "vitest";
import {
  applyEditActions,
  buildCompositeGeometry,
  cloneProject,
  makeShape,
  starterProject,
  validateProject,
} from "../lib/model";
import { createStlBlob } from "../lib/export";

describe("model edits", () => {
  it("applies a batch without mutating the previous project", () => {
    const original = cloneProject(starterProject);
    const next = applyEditActions(original, [
      { kind: "update", id: "vase-body", patch: { position: [4, 0, 0] } },
      { kind: "set-appearance", color: "#abcdef", roughness: 0.7 },
    ]);

    expect(original.shapes.find((shape) => shape.id === "vase-body")?.position).toEqual([0, 0, 0]);
    expect(next.shapes.find((shape) => shape.id === "vase-body")?.position).toEqual([4, 0, 0]);
    expect(next.color).toBe("#abcdef");
    expect(next.roughness).toBe(0.7);
  });

  it("keeps a locked shape when remove is requested", () => {
    const project = cloneProject(starterProject);
    project.shapes[0].locked = true;
    const next = applyEditActions(project, [{ kind: "remove", id: project.shapes[0].id }]);
    expect(next.shapes.some((shape) => shape.id === project.shapes[0].id)).toBe(true);
  });
});

describe("print geometry", () => {
  it("bakes the source transform into composite vertices", () => {
    const shape = makeShape("box", {
      position: [0, 0, 5],
      dimensions: {
        width: 20,
        depth: 30,
        height: 10,
        radius: 1,
        radiusTop: 1,
        radiusBottom: 1,
        tube: 1,
      },
    });
    const composite = buildCompositeGeometry([shape]);
    composite.geometry?.computeBoundingBox();

    expect(composite.error).toBeUndefined();
    expect(composite.geometry?.boundingBox?.min.z).toBeCloseTo(0);
    expect(composite.geometry?.boundingBox?.max.z).toBeCloseTo(10);
    composite.geometry?.dispose();
  });

  it("marks the starter project exportable and on the print bed", () => {
    const report = validateProject(starterProject);
    expect(report.printable).toBe(true);
    expect(report.bounds.min[2]).toBeCloseTo(0);
    expect(report.checks.find((check) => check.id === "bed-contact")?.level).toBe("pass");
  });

  it("builds the vase as a hollow printable shell", () => {
    const report = validateProject(starterProject);
    expect(starterProject.shapes[0].type).toBe("vase");
    expect(report.dimensions[0]).toBeGreaterThan(95);
    expect(report.dimensions[2]).toBeCloseTo(150);
    expect(report.boundaryEdges).toBe(0);
  });

  it("blocks a model that has no additive solid", () => {
    const project = cloneProject(starterProject);
    project.shapes = [makeShape("sphere", { operation: "cut" })];
    const report = validateProject(project);
    expect(report.printable).toBe(false);
    expect(report.checks.some((check) => check.level === "error")).toBe(true);
  });

  it("emits a non-empty binary STL artifact", async () => {
    const result = createStlBlob(starterProject);
    expect(result?.filename).toBe("minimal-modern-vase.stl");
    expect(result?.blob.type).toBe("model/stl");
    expect(result?.blob.size).toBeGreaterThan(84);

    const buffer = await result?.blob.arrayBuffer();
    const triangleCount = buffer ? new DataView(buffer).getUint32(80, true) : 0;
    expect(triangleCount).toBeGreaterThan(0);
  });

  it("keeps reference models out of validation and STL export", async () => {
    const project = applyEditActions(starterProject, [{
      kind: "add",
      shape: {
        type: "mac-mini",
        role: "reference",
        name: "Mac mini reference",
        position: [0, 0, 30],
        dimensions: {
          width: 127,
          depth: 127,
          height: 50,
          radius: 1,
          radiusTop: 1,
          radiusBottom: 1,
          tube: 1,
        },
      },
    }]);

    const baselineReport = validateProject(starterProject);
    const referenceReport = validateProject(project);
    expect(referenceReport.dimensions).toEqual(baselineReport.dimensions);
    expect(referenceReport.triangleCount).toBe(baselineReport.triangleCount);
    expect(referenceReport.boundaryEdges).toBe(baselineReport.boundaryEdges);

    const baselineStl = createStlBlob(starterProject);
    const referenceStl = createStlBlob(project);
    expect(referenceStl?.blob.size).toBe(baselineStl?.blob.size);
    expect(
      new Uint8Array(await referenceStl!.blob.arrayBuffer()),
    ).toEqual(new Uint8Array(await baselineStl!.blob.arrayBuffer()));
  });
});
