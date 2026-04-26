import {
  isWithinCooldown,
  reminderTierFromPayload,
} from './reminder-policy.util';

describe('reminderTierFromPayload', () => {
  it('maps includeExpired to expired', () => {
    expect(reminderTierFromPayload(0, true)).toBe('expired');
    expect(reminderTierFromPayload(30, true)).toBe('expired');
  });

  it('maps threshold <= 7 to 7d when not expired', () => {
    expect(reminderTierFromPayload(7, false)).toBe('7d');
    expect(reminderTierFromPayload(0, false)).toBe('7d');
  });

  it('maps threshold > 7 to 30d', () => {
    expect(reminderTierFromPayload(30, false)).toBe('30d');
    expect(reminderTierFromPayload(8, false)).toBe('30d');
  });
});

describe('isWithinCooldown', () => {
  const now = new Date('2026-04-26T12:00:00.000Z');

  it('returns false when never sent', () => {
    expect(isWithinCooldown(null, now, 7)).toBe(false);
    expect(isWithinCooldown(undefined, now, 7)).toBe(false);
  });

  it('returns true when sent within cooldown window', () => {
    const sent = new Date('2026-04-25T12:00:00.000Z'); // 1 day ago
    expect(isWithinCooldown(sent, now, 7)).toBe(true);
  });

  it('returns false when sent before cooldown window', () => {
    const sent = new Date('2026-04-10T12:00:00.000Z'); // 16 days ago
    expect(isWithinCooldown(sent, now, 7)).toBe(false);
  });

  it('treats zero cooldown as no cooldown', () => {
    const sent = new Date('2026-04-25T12:00:00.000Z');
    expect(isWithinCooldown(sent, now, 0)).toBe(false);
  });
});
