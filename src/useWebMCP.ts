import { useEffect } from "react";
import type { MutableRefObject } from "react";
import type { CaptureView } from "./components/ModelViewport";
import type {
  ActivityEntry,
  CameraPreset,
  EditAction,
  ModelProject,
  ToolFeedback,
} from "./types";
import { downloadStl } from "./lib/export";
import { validateProject } from "./lib/model";

interface WebMCPOptions {
  projectRef: MutableRefObject<ModelProject>;
  captureRef: MutableRefObject<CaptureView | null>;
  commit: (actions: EditAction[], source?: ActivityEntry["source"], title?: string) => ModelProject;
  addActivity: (entry: Omit<ActivityEntry, "id" | "timestamp">) => void;
  addFeedback: (entry: Omit<ToolFeedback, "id" | "timestamp">) => ToolFeedback;
  setStatus: (status: "checking" | "ready" | "unsupported" | "error") => void;
}

function textResult(value: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
  };
}

function modelSummary(project: ModelProject) {
  const report = validateProject(project);
  return {
    project: {
      id: project.id,
      name: project.name,
      unit: project.unit,
      appearance: {
        color: project.color,
        roughness: project.roughness,
        metalness: project.metalness,
      },
      buildVolume: project.buildVolume,
      updatedAt: project.updatedAt,
    },
    shapes: project.shapes,
    report,
    conventions: {
      axes: "X is width, Y is depth, Z is height. The print bed is Z=0.",
      angles: "degrees",
      operations: "Solid shapes are evaluated in list order. add unions a solid; cut subtracts it. Reference shapes render in the scene but never enter validation or STL export.",
    },
  };
}

const editSchema = {
  type: "object",
  properties: {
    actions: {
      type: "array",
      minItems: 1,
      description: "Ordered edits to apply as one reversible history entry.",
      items: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["add", "update", "remove", "duplicate", "set-appearance", "rename-project"],
          },
          id: { type: "string", description: "Existing shape id for update, remove, or duplicate." },
          name: { type: "string", description: "New project name when kind is rename-project." },
          shape: {
            type: "object",
            description: "Shape definition when kind is add.",
            properties: {
              type: { type: "string", enum: ["box", "cylinder", "sphere", "cone", "torus", "mac-mini"] },
              role: { type: "string", enum: ["solid", "reference"], default: "solid" },
              name: { type: "string" },
              operation: { type: "string", enum: ["add", "cut"] },
              position: { type: "array", items: { type: "number" }, minItems: 3, maxItems: 3 },
              rotation: { type: "array", items: { type: "number" }, minItems: 3, maxItems: 3 },
              scale: { type: "array", items: { type: "number" }, minItems: 3, maxItems: 3 },
              dimensions: {
                type: "object",
                properties: {
                  width: { type: "number", exclusiveMinimum: 0 },
                  height: { type: "number", exclusiveMinimum: 0 },
                  depth: { type: "number", exclusiveMinimum: 0 },
                  radius: { type: "number", exclusiveMinimum: 0 },
                  radiusTop: { type: "number", exclusiveMinimum: 0 },
                  radiusBottom: { type: "number", exclusiveMinimum: 0 },
                  tube: { type: "number", exclusiveMinimum: 0 },
                },
              },
            },
            required: ["type"],
          },
          patch: {
            type: "object",
            description: "Only the shape fields to change when kind is update.",
            properties: {
              name: { type: "string" },
              role: { type: "string", enum: ["solid", "reference"] },
              operation: { type: "string", enum: ["add", "cut"] },
              position: { type: "array", items: { type: "number" }, minItems: 3, maxItems: 3 },
              rotation: { type: "array", items: { type: "number" }, minItems: 3, maxItems: 3 },
              scale: { type: "array", items: { type: "number" }, minItems: 3, maxItems: 3 },
              visible: { type: "boolean" },
              dimensions: { type: "object", additionalProperties: { type: "number", exclusiveMinimum: 0 } },
            },
          },
          color: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
          roughness: { type: "number", minimum: 0, maximum: 1 },
          metalness: { type: "number", minimum: 0, maximum: 1 },
        },
        required: ["kind"],
      },
    },
    summary: {
      type: "string",
      description: "Short human-readable description shown in the shared activity log.",
    },
  },
  required: ["actions", "summary"],
} as const;

export function useWebMCP(options: WebMCPOptions) {
  useEffect(() => {
    const modelContext = document.modelContext;
    if (!modelContext) {
      options.setStatus("unsupported");
      return;
    }

    const controller = new AbortController();
    options.setStatus("checking");

    const tools: WebMCP.ModelContextTool[] = [
      {
        name: "inspect_model",
        title: "Inspect current model",
        description: "Read the complete shared model, shape ids, dimensions, axis conventions, print bounds, and current validation report before deciding what to edit.",
        inputSchema: { type: "object", properties: {} },
        annotations: { readOnlyHint: true },
        execute: () => textResult(modelSummary(options.projectRef.current)),
      },
      {
        name: "edit_model",
        title: "Edit model",
        description: "Apply one or more ordered parametric edits to the visible 3D model as a single reversible action. Use role=reference for non-printing context models such as a Mac mini. Use millimeters and inspect first when existing shape ids are needed.",
        inputSchema: editSchema,
        execute: (input) => {
          const actions = input.actions;
          if (!Array.isArray(actions) || !actions.length) throw new Error("actions must be a non-empty array");
          const summary = typeof input.summary === "string" ? input.summary : "Updated the shared model";
          const project = options.commit(actions as EditAction[], "Codex", summary.slice(0, 100));
          return textResult({ ok: true, result: modelSummary(project) });
        },
      },
      {
        name: "capture_model_view",
        title: "Capture model view",
        description: "Render a private PNG of the current model from an isometric, front, right, or top camera without moving the person's viewport. Use this to visually verify edits.",
        inputSchema: {
          type: "object",
          properties: {
            view: { type: "string", enum: ["isometric", "front", "right", "top"] },
            width: { type: "integer", minimum: 320, maximum: 1600, default: 900 },
            height: { type: "integer", minimum: 320, maximum: 1600, default: 900 },
            transparent: { type: "boolean", default: false },
          },
          required: ["view"],
        },
        annotations: { readOnlyHint: true },
        execute: async (input) => {
          if (!options.captureRef.current) throw new Error("The 3D viewport is not ready yet.");
          const view = input.view as CameraPreset;
          const capture = await options.captureRef.current({
            view,
            width: typeof input.width === "number" ? input.width : undefined,
            height: typeof input.height === "number" ? input.height : undefined,
            transparent: input.transparent === true,
          });
          options.addActivity({
            source: "Codex",
            title: "Agent inspected model",
            detail: `Captured a private ${view} view at ${capture.width} × ${capture.height}.`,
          });
          const data = capture.dataUrl.split(",")[1];
          return {
            content: [
              { type: "text", text: `Rendered ${view} view at ${capture.width} × ${capture.height} without changing the visible camera.` },
              { type: "image", data, mimeType: "image/png" },
            ],
          };
        },
      },
      {
        name: "validate_and_export_stl",
        title: "Validate or export STL",
        description: "Run print-oriented geometry checks. Set download=true only when the user asked to download an STL; export is blocked if any error-level check fails.",
        inputSchema: {
          type: "object",
          properties: {
            download: { type: "boolean", default: false },
          },
        },
        execute: (input) => {
          const project = options.projectRef.current;
          const report = validateProject(project);
          if (input.download !== true) return textResult({ downloaded: false, report });
          const result = downloadStl(project);
          options.addActivity({
            source: "Codex",
            title: result.ok ? "Agent exported STL" : "Agent export blocked",
            detail: result.message,
          });
          return textResult({ downloaded: result.ok, export: result, report });
        },
      },
      {
        name: "report_tool_feedback",
        title: "Report WebMCP tool feedback",
        description: "Tell the studio developer about a concrete missing capability, confusing schema, or failed tool call encountered while modeling.",
        inputSchema: {
          type: "object",
          properties: {
            severity: { type: "string", enum: ["note", "problem"] },
            toolName: { type: "string" },
            message: { type: "string", minLength: 4, maxLength: 600 },
          },
          required: ["severity", "toolName", "message"],
        },
        execute: (input) => {
          const entry = options.addFeedback({
            severity: input.severity === "problem" ? "problem" : "note",
            toolName: String(input.toolName ?? "unknown"),
            message: String(input.message ?? "No detail supplied."),
          });
          return textResult({ ok: true, feedbackId: entry.id });
        },
      },
    ];

    Promise.all(tools.map((tool) => modelContext.registerTool(tool, { signal: controller.signal })))
      .then(() => options.setStatus("ready"))
      .catch((error) => {
        console.error("WebMCP registration failed", error);
        options.setStatus("error");
      });

    return () => controller.abort();
  }, [
    options.addActivity,
    options.addFeedback,
    options.captureRef,
    options.commit,
    options.projectRef,
    options.setStatus,
  ]);
}
