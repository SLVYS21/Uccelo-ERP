import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowUp, Database, Loader2, MessageSquare, RotateCcw, Sparkles, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import type { AssistantMessage, AssistantToolTrace } from '@Moonscale/shared';
import { AssistantApi } from '@/api/crm.api';
import { cn } from '@/lib/utils';

type ChatMessage = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  pending?: boolean;
  error?: boolean;
  trace?: AssistantToolTrace[];
};

const SUGGESTIONS = [
  "Combien d'opportunités ouvertes et pour quel montant ?",
  'Quelles entreprises à Paris ?',
  'Mes tâches en retard',
  'Montant total gagné ce trimestre',
];

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderInline(value: string): string {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-black/5 px-1 py-0.5 text-[0.85em] dark:bg-white/10">$1</code>');
}

function renderMarkdown(value: string): string {
  const lines = value.split('\n');
  const html: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length > 0) {
      html.push(`<ul class="my-1 ml-4 list-disc space-y-0.5">${list.join('')}</ul>`);
      list = [];
    }
  };
  for (const line of lines) {
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      list.push(`<li>${renderInline(bullet[1])}</li>`);
      continue;
    }
    flush();
    if (line.trim() === '') continue;
    html.push(`<p class="my-1">${renderInline(line)}</p>`);
  }
  flush();
  return html.join('');
}

export function AssistantPanel() {
  const { teamSlug = '' } = useParams<{ teamSlug: string }>();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const counter = useRef(0);
  const thread = useRef<HTMLDivElement | null>(null);
  const field = useRef<HTMLTextAreaElement | null>(null);

  const send = useMutation({
    mutationFn: (history: AssistantMessage[]) => AssistantApi.chat(teamSlug, history),
  });

  const loading = send.isPending;
  const hasConversation = messages.length > 0;
  const canSend = draft.trim().length > 0 && !loading;

  useEffect(() => {
    requestAnimationFrame(() => {
      if (thread.current) thread.current.scrollTop = thread.current.scrollHeight;
    });
  }, [messages, open]);

  useEffect(() => {
    if (open) field.current?.focus();
  }, [open]);

  const resetConversation = () => {
    if (loading) return;
    setMessages([]);
    setDraft('');
    counter.current = 0;
    field.current?.focus();
  };

  const useSuggestion = (text: string) => {
    setDraft(text);
    field.current?.focus();
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (text === '' || loading || !teamSlug) return;

    counter.current += 1;
    const userMsg: ChatMessage = { id: counter.current, role: 'user', content: text };
    counter.current += 1;
    const placeholder: ChatMessage = { id: counter.current, role: 'assistant', content: '', pending: true };

    const next = [...messages, userMsg, placeholder];
    setMessages(next);
    setDraft('');

    const history: AssistantMessage[] = next
      .filter((m) => m.role === 'user' && !m.pending && !m.error && m.content !== '')
      .map((m) => ({ role: 'user' as const, content: m.content }));

    try {
      const reply = await send.mutateAsync(history);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholder.id ? { ...m, content: reply.reply, trace: reply.trace ?? [], pending: false } : m,
        ),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholder.id
            ? {
                ...m,
                content: "Connexion à l'assistant impossible. Vérifiez votre réseau et réessayez.",
                pending: false,
                error: true,
              }
            : m,
        ),
      );
    } finally {
      field.current?.focus();
    }
  };

  const onKeydown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  // Hide if not in a team-scoped page
  if (!teamSlug) return null;

  return (
    <>
      {/* Floating action button (bottom-right) */}
      <button
        type="button"
        aria-label={open ? 'Fermer l\'assistant' : 'Ouvrir l\'assistant'}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'fixed right-4 bottom-4 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full text-white shadow-glow-primary transition-transform duration-200',
          'bg-brand-gradient hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        {open ? <X className="size-6" /> : <MessageSquare className="size-6" />}
      </button>

      {/* Panel */}
      <div
        className={cn(
          'fixed right-4 bottom-20 z-30 flex h-[min(640px,calc(100vh-7rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-200',
          open ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
        )}
        role="dialog"
        aria-label="Assistant IA"
      >
        {/* Header */}
        <header className="bg-mesh relative flex items-center gap-3 border-b border-border px-4 py-3">
          <span className="bg-brand-gradient flex size-9 items-center justify-center rounded-xl text-white shadow-glow-primary">
            <Sparkles className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Assistant IA</p>
            <p className="truncate text-xs text-muted-foreground">Interrogez vos données CRM</p>
          </div>
          {hasConversation && (
            <button
              type="button"
              aria-label="Réinitialiser"
              disabled={loading}
              onClick={resetConversation}
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="size-4" />
            </button>
          )}
        </header>

        {/* Thread */}
        <div ref={thread} className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
          {messages.length === 0 && (
            <div className="flex h-full flex-col justify-center gap-3 py-4 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="size-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Posez une question sur votre CRM</p>
                <p className="mx-auto mt-1 max-w-[20rem] text-xs text-muted-foreground">
                  Entreprises, contacts, opportunités, tâches — champs personnalisés inclus.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => useSuggestion(s)}
                    className="cursor-pointer rounded-full border border-border bg-card/60 px-2.5 py-1 text-[11px] text-foreground/80 hover:border-primary/40 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className="max-w-[88%] space-y-1.5">
                {m.trace && m.trace.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.trace.map((t, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-card/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        <Database className="size-2.5 text-primary" />
                        {t.summary}
                      </span>
                    ))}
                  </div>
                )}
                <div
                  className={cn(
                    'rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm',
                    m.role === 'user'
                      ? 'rounded-br-md bg-primary text-primary-foreground'
                      : 'rounded-bl-md border border-border bg-card',
                    m.error && 'border-destructive/40 text-destructive',
                  )}
                >
                  {m.pending ? (
                    <span className="flex items-center gap-1.5 py-0.5">
                      <span className="size-1.5 animate-bounce rounded-full bg-current opacity-60 [animation-delay:-0.3s]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-current opacity-60 [animation-delay:-0.15s]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-current opacity-60" />
                    </span>
                  ) : (
                    <div
                      className="assistant-prose"
                      dangerouslySetInnerHTML={{
                        __html: m.role === 'assistant' ? renderMarkdown(m.content) : escapeHtml(m.content),
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-card/50 p-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-ring/40">
            <textarea
              ref={field}
              rows={1}
              placeholder="Tapez votre question…"
              className="max-h-24 min-h-8 flex-1 resize-none border-0 bg-transparent py-1 text-sm leading-normal placeholder:text-muted-foreground focus:outline-none"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeydown}
            />
            <button
              type="button"
              disabled={!canSend}
              aria-label="Envoyer"
              onClick={handleSend}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
