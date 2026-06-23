import { useState } from 'react';
import { Calendar, Mail, Phone, StickyNote, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ActivityItem, CrmEntity, CreateActivityDto } from '@Moonscale/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from './ConfirmDialog';
import { ActivitiesApi } from '@/api/crm.api';

const ICONS: Record<string, LucideIcon> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: StickyNote,
};

const TYPE_COLORS: Record<string, string> = {
  call: 'var(--brand-cyan)',
  email: 'var(--brand-violet)',
  meeting: 'var(--brand-amber)',
  note: 'var(--brand-indigo)',
};

const TYPES = [
  { value: 'note', label: 'Note' },
  { value: 'call', label: 'Appel' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Réunion' },
];

interface Props {
  activities: ActivityItem[];
  teamSlug: string;
  target: { type: CrmEntity; id: string };
  canManage: boolean;
}

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

export function ActivityTimeline({ activities, teamSlug, target, canManage }: Props) {
  const qc = useQueryClient();
  const [type, setType] = useState('note');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const create = useMutation({
    mutationFn: (dto: CreateActivityDto) => ActivitiesApi.create(teamSlug, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities'] });
      setSubject('');
      setBody('');
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => ActivitiesApi.remove(teamSlug, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activities'] }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({
      type,
      subject: subject || null,
      body: body || null,
      occurredAt: new Date().toISOString(),
      subjectableType: target.type,
      subjectableId: target.id,
    });
  };

  return (
    <div className="space-y-5">
      {canManage && (
        <form className="space-y-3 rounded-lg border bg-muted/30 p-4" onSubmit={submit}>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="flex-1"
              placeholder="Sujet (optionnel)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <Textarea
            placeholder="Décrivez l'échange…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={create.isPending}>
              Enregistrer
            </Button>
          </div>
        </form>
      )}

      {activities.length > 0 ? (
        <ol className="relative space-y-5 before:absolute before:top-1 before:bottom-3 before:left-[15px] before:w-px before:bg-border">
          {activities.map((a) => {
            const Icon = ICONS[a.type] ?? StickyNote;
            return (
              <li key={a.id} className="relative flex gap-3">
                <span
                  className="z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ring-4 ring-card"
                  style={{ backgroundColor: TYPE_COLORS[a.type] ?? 'var(--brand-indigo)' }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{a.subject || a.typeLabel}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.typeLabel} · {fmt.format(new Date(a.occurredAt))}
                        {a.user && <> · {a.user.name}</>}
                      </p>
                    </div>
                    {canManage && (
                      <ConfirmDialog
                        description="Supprimer cette activité ?"
                        onConfirm={() => remove.mutate(a.id)}
                      >
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </ConfirmDialog>
                    )}
                  </div>
                  {a.body && (
                    <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">{a.body}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">Aucune activité enregistrée.</p>
      )}
    </div>
  );
}
