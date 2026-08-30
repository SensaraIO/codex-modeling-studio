import {
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import type { EditAction, ModelProject, ShapeType } from "../types";
import { ShapeIcon } from "./ShapeIcon";

interface ModelTreeProps {
  project: ModelProject;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (type: ShapeType) => void;
  onCommit: (actions: EditAction[]) => void;
  onReset: () => void;
}

const addTypes: ShapeType[] = ["box", "cylinder", "sphere", "cone", "torus", "vase"];

export function ModelTree(props: ModelTreeProps) {
  const references = props.project.shapes.filter((shape) => shape.role === "reference");
  const referencesVisible = references.some((shape) => shape.visible);

  return (
    <aside className="left-panel">
      <section className="panel-section model-section">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Scene</p>
            <h2>Model tree</h2>
          </div>
          <button className="icon-button" title="Restore sample model" onClick={props.onReset}>
            <RotateCcw size={14} />
          </button>
        </div>

        <div className="model-root-row">
          <ChevronDown size={14} />
          <span className="root-cube"><span /></span>
          <strong>{props.project.name}</strong>
          <span className="count-pill">{props.project.shapes.length}</span>
        </div>

        {references.length ? (
          <button
            className="reference-toggle"
            onClick={() => props.onCommit(references.map((shape) => ({
              kind: "update" as const,
              id: shape.id,
              patch: { visible: !referencesVisible },
            })))}
          >
            <span className="reference-toggle-icon">
              {referencesVisible ? <Eye size={14} /> : <EyeOff size={14} />}
            </span>
            <span>
              <strong>{referencesVisible ? "Hide references" : "Show references"}</strong>
              <small>{references.length} Mac mini {references.length === 1 ? "model" : "models"}</small>
            </span>
          </button>
        ) : null}

        <div className="shape-list">
          {props.project.shapes.map((shape) => (
            <button
              className={`shape-row ${shape.id === props.selectedId ? "selected" : ""}`}
              key={shape.id}
              onClick={() => props.onSelect(shape.id)}
            >
              <span className={`shape-operation ${shape.role === "reference" ? "reference" : shape.operation}`} />
              <ShapeIcon type={shape.type} />
              <span className="shape-name">{shape.name}</span>
              <span className={`operation-label ${shape.role === "reference" ? "reference" : shape.operation}`}>
                {shape.role === "reference" ? "Ref" : shape.operation === "cut" ? "Cut" : "Add"}
              </span>
              <span
                className="row-action"
                role="button"
                tabIndex={0}
                title={shape.visible ? "Hide shape" : "Show shape"}
                onClick={(event) => {
                  event.stopPropagation();
                  props.onCommit([{ kind: "update", id: shape.id, patch: { visible: !shape.visible } }]);
                }}
                onKeyDown={(event) => event.key === "Enter" && event.currentTarget.click()}
              >
                {shape.visible ? <Eye size={13} /> : <EyeOff size={13} />}
              </span>
              {shape.locked ? <Lock className="locked-icon" size={11} /> : null}
            </button>
          ))}
        </div>

        <div className="add-shapes">
          <div className="add-label"><Plus size={13} /> Add primitive</div>
          <div className="primitive-grid">
            {addTypes.map((type) => (
              <button key={type} onClick={() => props.onAdd(type)} title={`Add ${type}`}>
                <ShapeIcon type={type} size={16} />
                <span>{type}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel-section selection-actions">
        <p className="eyebrow">Selection</p>
        <div className="selection-action-grid">
          <button
            disabled={!props.selectedId}
            onClick={() => props.selectedId && props.onCommit([{ kind: "duplicate", id: props.selectedId }])}
          >
            <Copy size={14} /> Duplicate
          </button>
          <button
            className="danger-action"
            disabled={!props.selectedId}
            onClick={() => props.selectedId && props.onCommit([{ kind: "remove", id: props.selectedId }])}
          >
            <Trash2 size={14} /> Remove
          </button>
        </div>
      </section>
    </aside>
  );
}
