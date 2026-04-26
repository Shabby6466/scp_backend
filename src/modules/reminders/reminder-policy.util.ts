export type ReminderTier = '30d' | '7d' | 'expired';

export function reminderTierFromPayload(
  threshold: number,
  includeExpired?: boolean,
): ReminderTier {
  if (includeExpired) return 'expired';
  if (threshold <= 7) return '7d';
  return '30d';
}

/** True if a send for this tier should be skipped (cooldown not elapsed). */
export function isWithinCooldown(
  sentAt: Date | null | undefined,
  now: Date,
  cooldownDays: number,
): boolean {
  if (!sentAt) return false;
  const ms = Math.max(0, cooldownDays) * 86_400_000;
  return now.getTime() - new Date(sentAt).getTime() < ms;
}
