import { useEffect, useMemo, useRef, useState } from "react";
import { Axis3D, Box, CircleDot } from "lucide-react";
import { ActivityPanel } from "./components/ActivityPanel";
import { Inspector } from "./components/Inspector";
import { ModelTree } from "./components/ModelTree";
import { ModelViewport, type CaptureView } from "./components/ModelViewport";
import { StudioHeader } from "./components/StudioHeader";
import { ViewportToolbar } from "./components/ViewportToolbar";
import { downloadStl } from "./lib/export";
import { makeId, validateProject } from "./lib/model";
import type { CameraPreset, EditAction, ShapeType } from "./types";
import { useStudio } from "./useStudio";
import { useWebMCP } from "./useWebMCP";

function downloadDataUrl(dataUrl: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export default function App() {
  const studio = useStudio();
  const captureRef = useRef<CaptureView | null>(null);
  const [activeView, setActiveView] = useState<CameraPreset>("isometric");
  const [viewNonce, setViewNonce] = useState(0);

  const selectedShape = studio.project.shapes.find((shape) => shape.id === studio.selectedId) ?? null;
  const report = useMemo(
    () => validateProject(studio.project),
    [studio.project.buildVolume, studio.project.shapes],
  );

  useEffect(() => {
    if (studio.selectedId && !studio.project.shapes.some((shape) => shape.id === studio.selectedId)) {
      studio.setSelectedId(studio.project.shapes[0]?.id ?? null);
    }
  }, [studio.project.shapes, studio.selectedId, studio.setSelectedId]);

  useWebMCP({
    projectRef: studio.projectRef,
    captureRef,
    commit: studio.commit,
    addActivity: studio.addActivity,
    addFeedback: studio.addFeedback,
    setStatus: studio.setWebMcpStatus,
  });

  const commitHuman = (actions: EditAction[]) => studio.commit(actions, "You");

  const addShape = (type: ShapeType) => {
    const id = makeId();
    const action: EditAction = {
      kind: "add",
      shape: {
        id,
        type,
        name: `New ${type}`,
        position: [0, 0, type === "sphere" ? 20 : 10],
        dimensions: type === "box"
          ? { width: 40, depth: 40, height: 20, radius: 20, radiusTop: 10, radiusBottom: 20, tube: 6 }
          : undefined,
      },
    };
    commitHuman([action]);
    studio.setSelectedId(id);
  };

  const changeView = (view: CameraPreset) => {
    setActiveView(view);
    setViewNonce((value) => value + 1);
  };

  const captureVisibleView = async () => {
    if (!captureRef.current) return;
    try {
      const capture = await captureRef.current({ view: activeView, width: 1200, height: 900 });
      downloadDataUrl(capture.dataUrl, `${studio.project.name.toLowerCase().replace(/\W+/g, "-")}-${activeView}.png`);
      studio.addActivity({
        source: "You",
        title: "Captured model view",
        detail: `Downloaded a ${capture.width} × ${capture.height} ${activeView} render.`,
      });
    } catch (error) {
      studio.addActivity({
        source: "System",
        title: "Capture failed",
        detail: error instanceof Error ? error.message : "The model view could not be rendered.",
      });
    }
  };

  const exportModel = () => {
    const result = downloadStl(studio.project);
    studio.addActivity({
      source: "You",
      title: result.ok ? "Exported printable model" : "Export blocked",
      detail: result.message,
    });
  };

  return (
    <main className="studio-shell">
      <StudioHeader project={studio.project} onCommit={commitHuman} />
      <div className="studio-grid">
        <div className="left-column">
          <ModelTree
            project={studio.project}
            selectedId={studio.selectedId}
            onSelect={studio.setSelectedId}
            onAdd={addShape}
            onCommit={commitHuman}
            onReset={studio.reset}
          />
          <ActivityPanel activities={studio.activities} status={studio.webMcpStatus} />
        </div>

        <section className="viewport-panel">
          <ModelViewport
            project={studio.project}
            selectedShape={selectedShape}
            onSelectModel={() => selectedShape || studio.setSelectedId(studio.project.shapes[0]?.id ?? null)}
            captureRef={captureRef}
            viewRequest={{ preset: activeView, nonce: viewNonce }}
          />
          <ViewportToolbar
            activeView={activeView}
            canUndo={studio.historyCount > 0}
            canRedo={studio.futureCount > 0}
            report={report}
            onView={changeView}
            onUndo={studio.undo}
            onRedo={studio.redo}
            onCapture={captureVisibleView}
            onExport={exportModel}
          />
          <div className="viewport-title-card">
            <span className="viewport-object-icon"><Box size={16} /></span>
            <div>
              <strong>{studio.project.name}</strong>
              <p>
                {studio.project.shapes.filter((shape) => shape.visible && shape.role !== "reference").length} solids
                {studio.project.shapes.some((shape) => shape.visible && shape.role === "reference")
                  ? ` · ${studio.project.shapes.filter((shape) => shape.visible && shape.role === "reference").length} refs`
                  : ""}
              </p>
            </div>
          </div>
          <div className="viewport-metrics">
            <span><Axis3D size={14} /> {report.dimensions.join(" × ")} mm</span>
            <span><CircleDot size={13} /> {report.triangleCount.toLocaleString()} tris</span>
            <span className={report.printable ? "printable" : "blocked"}>
              <i /> {report.printable ? "Checks passed" : "Export blocked"}
            </span>
          </div>
          <div className="axis-gizmo" aria-label="Coordinate axes">
            <span className="axis-z">Z</span>
            <span className="axis-y">Y</span>
            <span className="axis-x">X</span>
            <i />
          </div>
        </section>

        <Inspector
          project={studio.project}
          shape={selectedShape}
          report={report}
          feedbackCount={studio.feedback.length}
          onCommit={commitHuman}
          onExport={exportModel}
        />
      </div>
    </main>
  );
}
