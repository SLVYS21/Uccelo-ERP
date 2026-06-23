/**
 * Identifier of a team-scoped picklist (a closed list of options used in
 * dropdowns across the CRM). The values match what is stored in
 * `PicklistOption.picklist` on the backend.
 */
export const Picklist = {
  Industry: 'industry',
  DealSource: 'dealSource',
  LeadStatus: 'leadStatus',
  ActivityType: 'activityType',
  TaskPriority: 'taskPriority',
} as const;

export type Picklist = typeof Picklist[keyof typeof Picklist];

/**
 * Shape of an option when seeding system defaults. The runtime
 * `PicklistOption` document carries additional fields (`id`, `teamId`,
 * `position`); only the per-team defaults below are needed at seed time.
 */
export interface PicklistDefault {
  value: string;
  label: string;
  color: string | null;
  isSystem: boolean;
}

/**
 * Default options provisioned for every team when it is created (see
 * `PicklistsService.ensureDefaults`). All defaults are marked `isSystem`
 * so they cannot be deleted from the UI; labels are in French to match
 * the rest of the application.
 */
export const PICKLIST_DEFAULTS: Record<Picklist, readonly PicklistDefault[]> = {
  [Picklist.Industry]: [
    { value: 'technology', label: 'Technologie', color: '#2740e0', isSystem: true },
    { value: 'finance', label: 'Finance', color: '#10b981', isSystem: true },
    { value: 'retail', label: 'Commerce', color: '#f59e0b', isSystem: true },
    { value: 'manufacturing', label: 'Industrie', color: '#94a3b8', isSystem: true },
    { value: 'services', label: 'Services', color: '#8b5cf6', isSystem: true },
  ],
  [Picklist.DealSource]: [
    { value: 'website', label: 'Site web', color: '#06b6d4', isSystem: true },
    { value: 'referral', label: 'Recommandation', color: '#10b981', isSystem: true },
    { value: 'event', label: 'Événement', color: '#f59e0b', isSystem: true },
    { value: 'cold_outreach', label: 'Prospection sortante', color: '#94a3b8', isSystem: true },
    { value: 'other', label: 'Autre', color: null, isSystem: true },
  ],
  [Picklist.LeadStatus]: [
    { value: 'new', label: 'Nouveau', color: '#94a3b8', isSystem: true },
    { value: 'contacted', label: 'Contacté', color: '#06b6d4', isSystem: true },
    { value: 'qualified', label: 'Qualifié', color: '#2740e0', isSystem: true },
    { value: 'unqualified', label: 'Non qualifié', color: '#f43f5e', isSystem: true },
  ],
  [Picklist.ActivityType]: [
    { value: 'call', label: 'Appel', color: '#06b6d4', isSystem: true },
    { value: 'email', label: 'E-mail', color: '#8b5cf6', isSystem: true },
    { value: 'meeting', label: 'Rendez-vous', color: '#f59e0b', isSystem: true },
    { value: 'note', label: 'Note', color: '#94a3b8', isSystem: true },
  ],
  [Picklist.TaskPriority]: [
    { value: 'low', label: 'Basse', color: '#94a3b8', isSystem: true },
    { value: 'normal', label: 'Normale', color: '#2740e0', isSystem: true },
    { value: 'high', label: 'Haute', color: '#f43f5e', isSystem: true },
  ],
};
