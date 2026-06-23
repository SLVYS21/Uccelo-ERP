import { Link, useParams } from 'react-router-dom';
import {
  Activity as ActivityIcon,
  AlertTriangle,
  Building2,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { KpiCard } from '@/components/crm/KpiCard';
import { DashboardApi } from '@/api/crm.api';
import { formatCurrency } from '@/lib/format';

const CHART_COLORS = [
  'var(--brand-violet)',
  'var(--brand-cyan)',
  'var(--brand-emerald)',
  'var(--brand-amber)',
  'var(--brand-rose)',
  'var(--brand-indigo)',
];

const currency = { format: (value: number) => formatCurrency(value) };

const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

function fmtDate(iso: string | null): string {
  return iso ? dateFmt.format(new Date(iso)) : '—';
}

function fmtWeek(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(d);
}

export function DashboardPage() {
  const { teamSlug = '' } = useParams<{ teamSlug: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', teamSlug],
    queryFn: () => DashboardApi.page(teamSlug),
    enabled: !!teamSlug,
  });

  if (isLoading || !data) {
    return (
      <div className="flex flex-1 flex-col gap-5 p-4">
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const { kpis, charts, lists } = data;

  const cards = [
    {
      label: 'Valeur du pipeline',
      value: kpis.openDealsAmount,
      format: 'currency' as const,
      icon: Wallet,
      accent: 'indigo' as const,
      hint: 'opportunités ouvertes',
    },
    {
      label: 'Opportunités ouvertes',
      value: kpis.openDealsCount,
      format: 'number' as const,
      icon: Target,
      accent: 'sky' as const,
      hint: 'en cours',
    },
    {
      label: 'Opportunités gagnées',
      value: kpis.wonDealsCount,
      format: 'number' as const,
      icon: Trophy,
      accent: 'emerald' as const,
      hint: currency.format(kpis.wonDealsAmount),
    },
    {
      label: 'Taux de conversion',
      value: kpis.conversionRate,
      format: 'percent' as const,
      icon: TrendingUp,
      accent: 'violet' as const,
      hint: 'gagnées / clôturées',
    },
    {
      label: 'Entreprises',
      value: kpis.totalCompanies,
      format: 'number' as const,
      icon: Building2,
      accent: 'indigo' as const,
    },
    {
      label: 'Contacts',
      value: kpis.totalContacts,
      format: 'number' as const,
      icon: Users,
      accent: 'sky' as const,
    },
    {
      label: 'Tâches ouvertes',
      value: kpis.openTasksCount,
      format: 'number' as const,
      icon: ActivityIcon,
      accent: 'amber' as const,
    },
    {
      label: 'Tâches en retard',
      value: kpis.overdueTasksCount,
      format: 'number' as const,
      icon: AlertTriangle,
      accent: 'rose' as const,
      hint: 'à traiter',
    },
  ];

  const weeklyData = charts.weeklyDeals.map((w, i) => ({
    week: fmtWeek(w.weekStart),
    deals: w.count,
    activities: charts.weeklyActivities[i]?.count ?? 0,
  }));

  return (
    <div className="flex flex-1 flex-col gap-5 p-4">
      {/* Header banner */}
      <div className="bg-mesh flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-white shadow-glow-violet">
            <Sparkles className="h-[18px] w-[18px]" />
          </span>
          <div className="space-y-0.5">
            <h2 className="text-base font-medium tracking-tight">Tableau de bord</h2>
            <p className="text-xs text-muted-foreground">Vue d'ensemble de votre activité commerciale</p>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <KpiCard
            key={card.label}
            label={card.label}
            value={card.value}
            format={card.format}
            icon={card.icon}
            accent={card.accent}
            hint={card.hint}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Opportunités par semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="deals" name="Opportunités" fill="var(--brand-violet)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="activities" name="Activités" fill="var(--brand-cyan)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Santé du pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col items-center gap-2 pt-1">
              <div className="relative flex h-32 w-32 items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Converti', value: kpis.conversionRate },
                        { name: 'Restant', value: Math.max(0, 100 - kpis.conversionRate) },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={56}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      <Cell fill="var(--brand-violet)" />
                      <Cell fill="var(--muted)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold tracking-tight tabular-nums">{kpis.conversionRate}%</span>
                  <span className="text-[11px] text-muted-foreground">conversion</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {kpis.wonDealsCount} gagnées · {currency.format(kpis.openDealsAmount)} en cours
              </p>
            </div>
            <div className="border-t pt-4">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.stageDistribution.map((s) => ({ name: s.stageName, value: s.count }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      dataKey="value"
                      label
                    >
                      {charts.stageDistribution.map((s, i) => (
                        <Cell key={s.stageId} fill={s.color ?? CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lists */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Top opportunités</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {lists.recentDeals.map((deal) => (
              <Link
                key={deal.id}
                to={`/${teamSlug}/deals/${deal.id}`}
                className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted/60"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{deal.name}</span>
                  <span className="text-xs text-muted-foreground">{fmtDate(deal.updatedAt)}</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums">
                  {deal.amount != null ? currency.format(deal.amount) : '—'}
                </span>
              </Link>
            ))}
            {lists.recentDeals.length === 0 && (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">Aucune opportunité.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prochaines tâches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {lists.upcomingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm"
              >
                <span className="truncate">{task.title}</span>
                <span className="shrink-0 text-xs font-medium text-muted-foreground">{fmtDate(task.dueAt)}</span>
              </div>
            ))}
            {lists.upcomingTasks.length === 0 && (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">Aucune tâche à venir.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dernières activités</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {lists.recentActivities.map((activity) => (
              <div key={activity.id} className="rounded-lg px-2.5 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{activity.subject || activity.type}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(activity.occurredAt)}</span>
                </div>
                <p className="text-xs text-muted-foreground">{activity.type}</p>
              </div>
            ))}
            {lists.recentActivities.length === 0 && (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">Aucune activité.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
