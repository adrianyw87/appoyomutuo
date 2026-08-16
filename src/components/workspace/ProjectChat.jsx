import React, { useEffect, useState, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PersonHover from "@/components/PersonHover";
import moment from "moment";

export default function ProjectChat({ projectId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const list = await base44.entities.Message.filter(
          { project_id: projectId },
          "created_date",
          200
        );
        if (!cancelled) setMessages(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Chat load failed:", err);
        if (!cancelled) {
          setMessages([]);
          setError(err?.message || "No se pudieron cargar los mensajes");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    let unsub = () => {};
    try {
      const maybeUnsub = base44.entities.Message.subscribe((event) => {
        if (!event?.data || event.data.project_id !== projectId) return;
        if (event.type === "create") {
          setMessages((prev) =>
            prev.some((m) => m.id === event.data.id) ? prev : [...prev, event.data]
          );
        }
      });
      if (typeof maybeUnsub === "function") unsub = maybeUnsub;
    } catch (err) {
      console.error("Chat subscribe failed:", err);
    }

    return () => {
      cancelled = true;
      try {
        unsub();
      } catch {
        /* ignore */
      }
    };
  }, [projectId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError("");
    try {
      const m = await base44.entities.Message.create({
        project_id: projectId,
        content: text.trim(),
      });
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      setText("");
    } catch (err) {
      console.error("Chat send failed:", err);
      setError(err?.message || "No se pudo enviar el mensaje");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="h-full min-h-[320px] flex flex-col">
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
        {loading ? (
          <div className="grid place-items-center py-10 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : error && messages.length === 0 ? (
          <div className="text-center py-10 text-destructive text-sm px-4">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <p className="text-sm">Sin mensajes todavía. Empieza la conversación.</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="min-w-0">
              <div className="flex items-baseline gap-2">
                {m.created_by_id ? (
                  <PersonHover
                    userId={m.created_by_id}
                    size="xs"
                    preview={false}
                    className="inline-flex items-center"
                  />
                ) : (
                  <span className="text-sm font-medium">Alguien</span>
                )}
                <span className="text-[0.7rem] text-muted-foreground">
                  {m.created_date ? moment(m.created_date).format("DD MMM HH:mm") : ""}
                </span>
              </div>
              <p className="text-sm bg-muted/60 rounded-md px-3 py-2 mt-0.5 whitespace-pre-wrap break-words leading-relaxed">
                {m.content}
              </p>
            </div>
          ))
        )}
      </div>

      {error && messages.length > 0 && (
        <p className="text-xs text-destructive pt-1">{error}</p>
      )}

      <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t border-border mt-2 shrink-0">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje…"
          className="flex-1 min-w-0 px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="ui-cta inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium disabled:opacity-40 shrink-0"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
