import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  CircleAlert,
  Download,
  Info,
  SlidersHorizontal,
} from "lucide-react";
import type {
  EditAction,
  ModelProject,
  ModelReport,
  ModelShape,
  ShapeDimensions,
  Vec3,
} from "../types";

interface InspectorProps {
  project: ModelProject;
  shape: ModelShape | null;
  report: ModelReport;
  feedbackCount: number;
  onCommit: (actions: EditAction[]) => void;
  onExport: () => void;
}

function NumberField({
  label,
  value,
  suffix = "mm",
  step = 1,
  onCommit,
}: {
  label: string;
  value: number;
  suffix?: string;
  step?: number;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(Number(value.toFixed(3)))), [value]);

  const finish = () => {
    const next = Number(draft);
    if (Number.isFinite(next) && next !== value) onCommit(next);
    else setDraft(String(Number(value.toFixed(3))));
  };

  return (
    <label className="number-field">
      <span>{label}</span>
      <span className="number-input-wrap">
        <input
          type="number"
          value={draft}
          step={step}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={finish}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
        <small>{suffix}</small>
      </span>
    </label>
  );
}

const dimensionFields: Record<ModelShape["type"], Array<[keyof ShapeDimensions, string]>> = {
  box: [["width", "Width"], ["depth", "Depth"], ["height", "Height"]],
  cylinder: [["radius", "Radius"], ["height", "Height"]],
  sphere: [["radius", "Radius"]],
  cone: [["radiusBottom", "Base"], ["radiusTop", "Top"], ["height", "Height"]],
  torus: [["radius", "Radius"], ["tube", "Tube"]],
  vase: [["radius", "Belly"], ["radiusTop", "Neck"], ["height", "Height"], ["tube", "Wall"]],
  "mac-mini": [["width", "Width"], ["depth", "Depth"], ["height", "Height"]],
};

function TransformFields({
  label,
  values,
  suffix,
  onChange,
}: {
  label: string;
  values: Vec3;
  suffix: string;
  onChange: (next: Vec3) => void;
}) {
  return (
    <div className="field-block">
      <span className="field-block-label">{label}</span>
      <div className="axis-fields">
        {(["X", "Y", "Z"] as const).map((axis, index) => (
          <NumberField
            key={axis}
            label={axis}
            value={values[index]}
            suffix={suffix}
            onCommit={(value) => {
              const next = [...values] as Vec3;
              next[index] = value;
              onChange(next);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function Inspector(props: InspectorProps) {
  const [tab, setTab] = useState<"shape" | "print">("shape");
  const shape = props.shape;

  return (
    <aside className="right-panel">
      <div className="inspector-tabs">
        <button className={tab === "shape" ? "active" : ""} onClick={() => setTab("shape")}>Shape</button>
        <button className={tab === "print" ? "active" : ""} onClick={() => setTab("print")}>
          Print checks
          {props.report.checks.some((check) => check.level === "error") ? <span className="tab-alert" /> : null}
        </button>
      </div>

      {tab === "shape" ? (
        <div className="inspector-content">
          {shape ? (
            <>
              <div className="inspector-title">
                <div className="inspector-mark"><SlidersHorizontal size={16} /></div>
                <div>
                  <p className="eyebrow">Selected {shape.type}</p>
                  <input
                    key={shape.id}
                    className="shape-title-input"
                    defaultValue={shape.name}
                    onBlur={(event) => {
                      const name = event.target.value.trim();
                      if (name && name !== shape.name) props.onCommit([{ kind: "update", id: shape.id, patch: { name } }]);
                    }}
                  />
                </div>
              </div>

              <div className="property-group">
                <div className="property-heading">Operation</div>
                {shape.role === "reference" ? (
                  <div className="reference-callout">
                    <Info size={14} />
                    <span><strong>Reference only</strong> Visible in the studio, excluded from STL export.</span>
                  </div>
                ) : <div className="segmented-control">
                  <button
                    className={shape.operation === "add" ? "active" : ""}
                    onClick={() => props.onCommit([{ kind: "update", id: shape.id, patch: { operation: "add" } }])}
                  >
                    Add solid
                  </button>
                  <button
                    className={shape.operation === "cut" ? "active cut" : ""}
                    onClick={() => props.onCommit([{ kind: "update", id: shape.id, patch: { operation: "cut" } }])}
                  >
                    Cut away
                  </button>
                </div>}
              </div>

              <div className="property-group">
                <div className="property-heading">Dimensions</div>
                <div className="dimension-fields">
                  {dimensionFields[shape.type].map(([key, label]) => (
                    <NumberField
                      key={key}
                      label={label}
                      value={shape.dimensions[key]}
                      onCommit={(value) => props.onCommit([{ kind: "update", id: shape.id, patch: { dimensions: { ...shape.dimensions, [key]: value } } }])}
                    />
                  ))}
                </div>
              </div>

              <div className="property-group">
                <div className="property-heading">Transform</div>
                <TransformFields
                  label="Position"
                  values={shape.position}
                  suffix="mm"
                  onChange={(position) => props.onCommit([{ kind: "update", id: shape.id, patch: { position } }])}
                />
                <TransformFields
                  label="Rotation"
                  values={shape.rotation}
                  suffix="deg"
                  onChange={(rotation) => props.onCommit([{ kind: "update", id: shape.id, patch: { rotation } }])}
                />
              </div>

              <div className="property-group appearance-group">
                <div className="property-heading">Model finish</div>
                <label className="color-field">
                  <span>Material color</span>
                  <span className="color-control">
                    <input
                      type="color"
                      value={props.project.color}
                      onChange={(event) => props.onCommit([{ kind: "set-appearance", color: event.target.value }])}
                    />
                    <code>{props.project.color.toUpperCase()}</code>
                  </span>
                </label>
                <label className="range-field">
                  <span>Roughness <small>{props.project.roughness.toFixed(2)}</small></span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={props.project.roughness}
                    onChange={(event) => props.onCommit([{ kind: "set-appearance", roughness: Number(event.target.value) }])}
                  />
                </label>
              </div>
            </>
          ) : (
            <div className="empty-inspector">
              <Info size={20} />
              <h3>Select a shape</h3>
              <p>Choose a primitive in the model tree to edit its dimensions and transform.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="inspector-content print-panel">
          <div className={`print-summary ${props.report.printable ? "ready" : "blocked"}`}>
            <span className="summary-icon">
              {props.report.printable ? <Check size={18} /> : <CircleAlert size={18} />}
            </span>
            <div>
              <p className="eyebrow">Export status</p>
              <h3>{props.report.printable ? "Ready to export" : "Needs attention"}</h3>
              <p>{props.report.dimensions.join(" × ")} mm</p>
            </div>
          </div>

          <div className="report-stats">
            <div><span>Triangles</span><strong>{props.report.triangleCount.toLocaleString()}</strong></div>
            <div><span>Active bodies</span><strong>1</strong></div>
            <div><span>Build plate</span><strong>{props.project.buildVolume[0]} mm</strong></div>
          </div>

          <div className="checks-list">
            {props.report.checks.map((check) => (
              <div className={`check-row ${check.level}`} key={check.id}>
                <span className="check-icon">
                  {check.level === "pass" ? <Check size={14} /> : <AlertTriangle size={14} />}
                </span>
                <div>
                  <strong>{check.label}</strong>
                  <p>{check.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="export-button" disabled={!props.report.printable} onClick={props.onExport}>
            <Download size={16} /> Export binary STL
          </button>
          <p className="export-note">The export check covers model bounds and mesh structure. Confirm orientation, material, supports, and strength in your slicer.</p>

          {props.feedbackCount ? (
            <div className="feedback-note">
              <CircleAlert size={14} />
              Codex has filed {props.feedbackCount} tool {props.feedbackCount === 1 ? "note" : "notes"} this session.
            </div>
          ) : null}
        </div>
      )}
    </aside>
  );
}
