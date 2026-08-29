import {
  Box,
  Camera,
  Download,
  Redo2,
  Scan,
  Undo2,
} from "lucide-react";
import type { CameraPreset, ModelReport } from "../types";

interface ViewportToolbarProps {
  activeView: CameraPreset;
  canUndo: boolean;
  canRedo: boolean;
  report: ModelReport;
  onView: (view: CameraPreset) => void;
  onUndo: () => void;
  onRedo: () => void;
  onCapture: () => void;
  onExport: () => void;
}

const views: Array<[CameraPreset, string]> = [
  ["isometric", "Perspective"],
  ["front", "Front"],
  ["right", "Right"],
  ["top", "Top"],
];

export function ViewportToolbar(props: ViewportToolbarProps) {
  return (
    <>
      <div className="viewport-toolbar">
        <div className="toolbar-group">
          <button aria-label="Undo" title="Undo" disabled={!props.canUndo} onClick={props.onUndo}><Undo2 size={15} /></button>
          <button aria-label="Redo" title="Redo" disabled={!props.canRedo} onClick={props.onRedo}><Redo2 size={15} /></button>
        </div>
        <span className="toolbar-divider" />
        <div className="toolbar-group view-buttons">
          {views.map(([view, label]) => (
            <button
              key={view}
              className={props.activeView === view ? "active" : ""}
              aria-label={`${label} view`}
              title={`${label} view`}
              onClick={() => props.onView(view)}
            >
              {view === "isometric" ? <Box size={15} /> : <span>{label.slice(0, 1)}</span>}
            </button>
          ))}
        </div>
        <span className="toolbar-divider" />
        <div className="toolbar-group">
          <button aria-label="Capture model view" title="Capture model view" onClick={props.onCapture}><Camera size={15} /></button>
          <button aria-label="Frame model" title="Frame model" onClick={() => props.onView(props.activeView)}><Scan size={15} /></button>
        </div>
      </div>

      <button
        className="floating-export"
        disabled={!props.report.printable}
        onClick={props.onExport}
      >
        <Download size={15} /> Export STL
      </button>
    </>
  );
}
