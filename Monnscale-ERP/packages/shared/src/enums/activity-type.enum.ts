/**
 * Common activity types proposed in the timeline composer. The backend stores
 * activity types as free-form strings, so this enum is advisory — picklist
 * options (`Picklist.ActivityType`) can extend the available values per team.
 */
export const ActivityType = {
  Call: 'call',
  Email: 'email',
  Meeting: 'meeting',
  Note: 'note',
} as const;

export type ActivityType = typeof ActivityType[keyof typeof ActivityType];
