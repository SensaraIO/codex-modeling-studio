import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ActivityEntry,
  EditAction,
  ModelProject,
  ToolFeedback,
} from "./types";
import {
  applyEditActions,
  cloneProject,
  describeActions,
  makeId,
  starterProject,
} from "./lib/model";

const STORAGE_KEY = "codex-modeling-studio.project.v1";

function loadProject(): ModelProject {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return cloneProject(starterProject);
    const parsed = JSON.parse(value) as ModelProject;
    if (!Array.isArray(parsed.shapes) || parsed.unit !== "mm") return cloneProject(starterProject);
    return {
      ...parsed,
      shapes: parsed.shapes.map((shape) => ({ ...shape, role: shape.role === "reference" ? "reference" : "solid" })),
    };
  } catch {
    return cloneProject(starterProject);
  }
}

function activity(
  source: ActivityEntry["source"],
  title: string,
  detail: string,
): ActivityEntry {
  return {
    id: makeId("activity"),
    source,
    title,
    detail,
    timestamp: new Date().toISOString(),
  };
}

export function useStudio() {
  const [project, setProjectState] = useState<ModelProject>(loadProject);
  const projectRef = useRef(project);
  const [selectedId, setSelectedId] = useState(project.shapes[0]?.id ?? null);
  const [history, setHistory] = useState<ModelProject[]>([]);
  const [future, setFuture] = useState<ModelProject[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([
    activity("System", "Studio opened", "The shared model is ready for human and agent edits."),
  ]);
  const [feedback, setFeedback] = useState<ToolFeedback[]>([]);
  const [webMcpStatus, setWebMcpStatus] = useState<"checking" | "ready" | "unsupported" | "error">("checking");

  const setProject = useCallback((next: ModelProject) => {
    projectRef.current = next;
    setProjectState(next);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  }, [project]);

  const addActivity = useCallback((entry: Omit<ActivityEntry, "id" | "timestamp">) => {
    setActivities((items) => [activity(entry.source, entry.title, entry.detail), ...items].slice(0, 30));
  }, []);

  const commit = useCallback(
    (
      actions: EditAction[],
      source: ActivityEntry["source"] = "You",
      title = source === "Codex" ? "Agent edited model" : "Model edited",
    ) => {
      if (!actions.length) return projectRef.current;
      const current = projectRef.current;
      const next = applyEditActions(current, actions);
      setHistory((items) => [...items, cloneProject(current)].slice(-50));
      setFuture([]);
      setProject(next);
      addActivity({ source, title, detail: describeActions(actions) });
      return next;
    },
    [addActivity, setProject],
  );

  const undo = useCallback(() => {
    setHistory((items) => {
      const target = items.at(-1);
      if (!target) return items;
      setFuture((futureItems) => [cloneProject(projectRef.current), ...futureItems].slice(0, 50));
      setProject(cloneProject(target));
      addActivity({ source: "You", title: "Undid model edit", detail: "Restored the previous model state." });
      return items.slice(0, -1);
    });
  }, [addActivity, setProject]);

  const redo = useCallback(() => {
    setFuture((items) => {
      const target = items[0];
      if (!target) return items;
      setHistory((historyItems) => [...historyItems, cloneProject(projectRef.current)].slice(-50));
      setProject(cloneProject(target));
      addActivity({ source: "You", title: "Redid model edit", detail: "Restored the next model state." });
      return items.slice(1);
    });
  }, [addActivity, setProject]);

  const reset = useCallback(() => {
    const current = projectRef.current;
    setHistory((items) => [...items, cloneProject(current)].slice(-50));
    setFuture([]);
    setProject(cloneProject(starterProject));
    setSelectedId(starterProject.shapes[0]?.id ?? null);
    addActivity({ source: "You", title: "Loaded sample model", detail: "Restored the desktop cradle example." });
  }, [addActivity, setProject]);

  const addFeedback = useCallback((entry: Omit<ToolFeedback, "id" | "timestamp">) => {
    const next: ToolFeedback = {
      ...entry,
      id: makeId("feedback"),
      timestamp: new Date().toISOString(),
    };
    setFeedback((items) => [next, ...items].slice(0, 30));
    addActivity({
      source: "Codex",
      title: entry.severity === "problem" ? "Tool issue reported" : "Tool note added",
      detail: `${entry.toolName}: ${entry.message}`,
    });
    return next;
  }, [addActivity]);

  return {
    project,
    projectRef,
    selectedId,
    setSelectedId,
    historyCount: history.length,
    futureCount: future.length,
    activities,
    feedback,
    webMcpStatus,
    setWebMcpStatus,
    addActivity,
    addFeedback,
    commit,
    undo,
    redo,
    reset,
  };
}
