import { Cloud, Command, PanelLeft, Share2 } from "lucide-react";
import type { EditAction, ModelProject } from "../types";

export function StudioHeader({
  project,
  onCommit,
}: {
  project: ModelProject;
  onCommit: (actions: EditAction[]) => void;
}) {
  return (
    <header className="studio-header">
      <div className="brand-lockup">
        <span className="brand-mark"><Command size={18} strokeWidth={1.7} /></span>
        <div>
          <span className="brand-name">Codex</span>
          <span className="brand-product">Modeling Studio</span>
        </div>
      </div>
      <span className="header-rule" />
      <button className="sidebar-toggle" title="Toggle scene panel"><PanelLeft size={15} /></button>
      <input
        className="project-name-input"
        key={project.name}
        defaultValue={project.name}
        onBlur={(event) => {
          const name = event.target.value.trim();
          if (name && name !== project.name) onCommit([{ kind: "rename-project", name }]);
        }}
      />
      <span className="saved-state"><Cloud size={13} /> Saved locally</span>
      <div className="header-actions">
        <span className="unit-chip">mm</span>
        <button className="share-button" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
          <Share2 size={14} /> Share view
        </button>
      </div>
    </header>
  );
}
