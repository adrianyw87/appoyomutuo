import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

const COLUMNS = [
  { id: "todo", label: "Pendientes", dot: "bg-amber-500" },
  { id: "doing", label: "En marcha", dot: "bg-blue-500" },
  { id: "done", label: "Hechas", dot: "bg-emerald-500" },
];

export default function TaskBoard({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    const items = await base44.entities.Task.filter({ project_id: projectId });
    setTasks(items);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [projectId]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const t = await base44.entities.Task.create({
        project_id: projectId,
        title: newTitle.trim(),
        status: "todo",
      });
      setTasks((prev) => [...prev, t]);
      setNewTitle("");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await base44.entities.Task.delete(id);
    } catch {
      load();
    }
  }

  async function onDragEnd(res) {
    if (!res.destination) return;
    const destStatus = res.destination.droppableId;
    const task = tasks.find((t) => t.id === res.draggableId);
    if (!task || task.status === destStatus) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: destStatus } : t))
    );
    try {
      await base44.entities.Task.update(task.id, { status: destStatus });
    } catch {
      load();
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-10 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Añadir una tarea…"
          className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <button
          type="submit"
          disabled={creating || !newTitle.trim()}
          className="ui-cta inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium disabled:opacity-40"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Añadir
        </button>
      </form>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <Droppable droppableId={col.id} key={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "rounded-md border border-border bg-muted/30 p-2.5 min-h-[120px] transition-colors",
                      snapshot.isDraggingOver && "bg-accent/10 border-accent/40"
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-2 px-1">
                      <span className={cn("w-2 h-2 rounded-full", col.dot)} />
                      <h4 className="text-sm font-medium">{col.label}</h4>
                      <span className="text-xs text-muted-foreground ml-auto">{colTasks.length}</span>
                    </div>
                    <div className="space-y-2">
                      {colTasks.map((t, i) => (
                        <Draggable draggableId={t.id} index={i} key={t.id}>
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className={cn(
                                "group bg-card border border-border rounded-md px-3 py-2 text-sm shadow-sm cursor-grab active:cursor-grabbing",
                                snap.isDragging && "shadow-md ring-2 ring-accent/40"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="leading-snug">{t.title}</span>
                                <button
                                  onClick={() => handleDelete(t.id)}
                                  className="text-muted-foreground/50 hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  aria-label="Borrar tarea"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <p className="text-xs text-muted-foreground/60 text-center py-4">Arrastra aquí</p>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
      <p className="text-xs text-muted-foreground text-center">Arrastra las tareas entre columnas para cambiar su estado.</p>
    </div>
  );
}