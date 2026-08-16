import React, { useEffect, useState, useRef } from "react";
import { Megaphone, Trash2, Loader2, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PersonHover from "@/components/PersonHover";
import moment from "moment";

export default function AnnouncementBoard({ projectId }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const scrollRef = useRef(null);

  async function load() {
    const list = await base44.entities.Announcement.filter({ project_id: projectId }, "-created_date", 50);
    setItems(list);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [projectId]);

  async function handlePost(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    try {
      const a = await base44.entities.Announcement.create({ project_id: projectId, content: text.trim() });
      setItems((prev) => [a, ...prev]);
      setText("");
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id) {
    setItems((prev) => prev.filter((a) => a.id !== id));
    try {
      await base44.entities.Announcement.delete(id);
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
      <form onSubmit={handlePost} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un anuncio para el grupo…"
          className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <button
          type="submit"
          disabled={posting || !text.trim()}
          className="ui-cta inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium disabled:opacity-40"
        >
          {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Publicar
        </button>
      </form>

      {items.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Aún no hay anuncios. Publica el primero.</p>
        </div>
      ) : (
        <div className="space-y-3" ref={scrollRef}>
          {items.map((a) => (
            <div key={a.id} className="group relative rounded-md border border-border bg-card p-4 pr-10">
              <div className="flex items-center gap-2 mb-2">
                <PersonHover userId={a.created_by_id} size="xs" preview={false} className="inline-flex items-center gap-1.5" />
                <span className="text-xs text-muted-foreground">{moment(a.created_date).fromNow()}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{a.content}</p>
              {a.created_by_id === user?.id && (
                <button
                  onClick={() => handleDelete(a.id)}
                  className="absolute top-3 right-3 text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Borrar anuncio"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}