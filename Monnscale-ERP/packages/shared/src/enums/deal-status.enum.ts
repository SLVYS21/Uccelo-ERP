/**
 * Derived status of a Deal. Mirrors the `Deal.status` column on the backend.
 * The value is computed from the parent stage's `isWon` / `isLost` flags via
 * `dealStatusFromStageFlags`.
 */
export const DealStatus = {
  Open: 'open',
  Won: 'won',
  Lost: 'lost',
} as const;

export type DealStatus = typeof DealStatus[keyof typeof DealStatus];

/**
 * Compute the deal status from the destination stage flags.
 *
 * Rules:
 *  - `isWon`  → `Won`
 *  - `isLost` → `Lost`
 *  - otherwise → `Open`
 *
 * If both flags are true, `Won` wins (defensive — the backend rejects
 * stages where both are true).
 */
export function dealStatusFromStageFlags(isWon: boolean, isLost: boolean): DealStatus {
  if (isWon) return DealStatus.Won;
  if (isLost) return DealStatus.Lost;
  return DealStatus.Open;
}
