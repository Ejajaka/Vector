/** Trash retention: a project moved to trash is restorable for 30 days. */
export const TRASH_RETENTION_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

function movedAt(value: string): number {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : Date.now();
}

/** When the trashed project is deleted for good. */
export function trashExpiresAt(updatedAt: string): number {
  return movedAt(updatedAt) + TRASH_RETENTION_DAYS * DAY_MS;
}

/** Whole days left before automatic deletion (never negative). */
export function daysLeftInTrash(updatedAt: string, now = Date.now()): number {
  return Math.max(0, Math.ceil((trashExpiresAt(updatedAt) - now) / DAY_MS));
}

export function isTrashExpired(updatedAt: string, now = Date.now()): boolean {
  return now >= trashExpiresAt(updatedAt);
}
