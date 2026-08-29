import { Bot, Radio, UserRound } from "lucide-react";
import type { ActivityEntry } from "../types";

interface ActivityPanelProps {
  activities: ActivityEntry[];
  status: "checking" | "ready" | "unsupported" | "error";
}

function timeLabel(value: string) {
  return new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

const statusCopy = {
  checking: ["Checking WebMCP", "Looking for the browser tool API"],
  ready: ["Agent tools live", "Five WebMCP tools are discoverable"],
  unsupported: ["Preview mode", "Enable WebMCP to let Codex edit here"],
  error: ["Tool registration failed", "Open the console for the browser error"],
} as const;

export function ActivityPanel({ activities, status }: ActivityPanelProps) {
  return (
    <section className="activity-panel">
      <div className="agent-status-card">
        <span className={`agent-orb ${status}`}><Radio size={14} /></span>
        <div>
          <strong>{statusCopy[status][0]}</strong>
          <p>{statusCopy[status][1]}</p>
        </div>
        <span className="tool-count">5 tools</span>
      </div>

      <div className="activity-heading">
        <p className="eyebrow">Shared activity</p>
        <span>Live</span>
      </div>
      <div className="activity-list">
        {activities.slice(0, 4).map((entry) => (
          <div className="activity-entry" key={entry.id}>
            <span className={`activity-avatar ${entry.source.toLowerCase()}`}>
              {entry.source === "Codex" ? <Bot size={13} /> : <UserRound size={13} />}
            </span>
            <div>
              <div className="activity-meta">
                <strong>{entry.title}</strong>
                <time>{timeLabel(entry.timestamp)}</time>
              </div>
              <p>{entry.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
