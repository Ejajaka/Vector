import { describe, expect, it } from 'vitest';
import { daysLeftInTrash, isTrashExpired, trashExpiresAt, TRASH_RETENTION_DAYS } from './trashRetention.ts';

const NOW = new Date('2026-11-26T12:00:00.000Z').getTime();
const daysAgo = (days: number) => new Date(NOW - days * 24 * 60 * 60 * 1000).toISOString();

describe('trash retention', () => {
  it('expires exactly 30 days after the move', () => {
    const moved = daysAgo(0);
    expect(trashExpiresAt(moved) - new Date(moved).getTime()).toBe(TRASH_RETENTION_DAYS * 86_400_000);
    expect(daysLeftInTrash(moved, NOW)).toBe(30);
    expect(isTrashExpired(moved, NOW)).toBe(false);
  });

  it('counts down and expires after 30 days', () => {
    expect(daysLeftInTrash(daysAgo(29), NOW)).toBe(1);
    expect(isTrashExpired(daysAgo(29), NOW)).toBe(false);
    expect(daysLeftInTrash(daysAgo(30), NOW)).toBe(0);
    expect(isTrashExpired(daysAgo(30), NOW)).toBe(true);
    expect(daysLeftInTrash(daysAgo(45), NOW)).toBe(0);
    expect(isTrashExpired(daysAgo(45), NOW)).toBe(true);
  });

  it('treats an unparseable timestamp as just moved', () => {
    expect(daysLeftInTrash('not-a-date', NOW)).toBe(30);
    expect(isTrashExpired('not-a-date', NOW)).toBe(false);
  });
});
