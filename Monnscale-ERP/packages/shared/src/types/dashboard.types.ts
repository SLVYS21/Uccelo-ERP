/**
 * Tile values surfaced on the dashboard header.
 */
export interface DashboardKpis {
  totalCompanies: number;
  totalContacts: number;
  openDealsCount: number;
  openDealsAmount: number;
  wonDealsCount: number;
  wonDealsAmount: number;
  conversionRate: number;
  openTasksCount: number;
  overdueTasksCount: number;
}

/**
 * Pipeline breakdown shown on the "Health of pipeline" donut chart.
 */
export interface DashboardStageDatum {
  stageId: string;
  stageName: string;
  color: string | null;
  count: number;
  amount: number;
}

/**
 * Single bucket of the weekly chart series.
 */
export interface DashboardWeeklyBucket {
  weekStart: string;
  count: number;
  amount: number;
}

/**
 * Chart series rendered on the dashboard.
 */
export interface DashboardCharts {
  stageDistribution: DashboardStageDatum[];
  weeklyDeals: DashboardWeeklyBucket[];
  weeklyActivities: DashboardWeeklyBucket[];
}

/**
 * Highlighted lists rendered next to the charts.
 */
export interface DashboardLists {
  recentDeals: Array<{
    id: string;
    name: string;
    amount: number | null;
    updatedAt: string;
  }>;
  upcomingTasks: Array<{
    id: string;
    title: string;
    dueAt: string | null;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    subject: string | null;
    occurredAt: string;
  }>;
}

/**
 * Response body of `GET /teams/:slug/dashboard`.
 */
export interface DashboardPage {
  kpis: DashboardKpis;
  charts: DashboardCharts;
  lists: DashboardLists;
  range: { from: string; to: string };
}
