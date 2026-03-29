import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  NFL_SEASON,
  getCurrentNflWeek,
  isOffSeason,
  getDefaultWeek,
  getAvailableWeeks,
  REGULAR_SEASON_GAMES,
} from '../data/regularSeasonGames';

// ── helpers ────────────────────────────────────────────────────────────────

function mockDate(isoString) {
  vi.setSystemTime(new Date(isoString));
}

// ── NFL_SEASON config ──────────────────────────────────────────────────────

describe('NFL_SEASON', () => {
  it('has the correct year', () => {
    expect(NFL_SEASON.year).toBe(2026);
  });

  it('regular season starts before it ends', () => {
    expect(NFL_SEASON.regularSeasonStart < NFL_SEASON.regularSeasonEnd).toBe(true);
  });

  it('playoffs end after regular season ends', () => {
    expect(NFL_SEASON.playoffsEnd > NFL_SEASON.regularSeasonEnd).toBe(true);
  });
});

// ── isOffSeason ────────────────────────────────────────────────────────────

describe('isOffSeason', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns true before the season starts', () => {
    mockDate('2026-06-01');
    expect(isOffSeason()).toBe(true);
  });

  it('returns false during the regular season', () => {
    mockDate('2026-10-15');
    expect(isOffSeason()).toBe(false);
  });

  it('returns false during the playoffs', () => {
    mockDate('2027-01-20');
    expect(isOffSeason()).toBe(false);
  });

  it('returns true after playoffs end', () => {
    mockDate('2027-03-01');
    expect(isOffSeason()).toBe(true);
  });
});

// ── getCurrentNflWeek ──────────────────────────────────────────────────────

describe('getCurrentNflWeek', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns null before the season', () => {
    mockDate('2026-06-01');
    expect(getCurrentNflWeek()).toBeNull();
  });

  it('returns null after the regular season', () => {
    mockDate('2027-01-10');
    expect(getCurrentNflWeek()).toBeNull();
  });

  it('returns 1 in the first week', () => {
    const start = NFL_SEASON.regularSeasonStart;
    mockDate(new Date(start.getTime() + 1000 * 60 * 60 * 24).toISOString()); // +1 day
    expect(getCurrentNflWeek()).toBe(1);
  });

  it('returns 18 in the last week', () => {
    const end = NFL_SEASON.regularSeasonEnd;
    mockDate(new Date(end.getTime() - 1000 * 60 * 60 * 24).toISOString()); // -1 day
    expect(getCurrentNflWeek()).toBe(18);
  });

  it('never returns more than 18', () => {
    mockDate('2026-12-20');
    const week = getCurrentNflWeek();
    if (week !== null) expect(week).toBeLessThanOrEqual(18);
  });
});

// ── getAvailableWeeks ──────────────────────────────────────────────────────

describe('getAvailableWeeks', () => {
  it('returns an array of week numbers', () => {
    const weeks = getAvailableWeeks(REGULAR_SEASON_GAMES);
    expect(Array.isArray(weeks)).toBe(true);
    weeks.forEach((w) => expect(typeof w).toBe('number'));
  });

  it('returns empty array for empty games object', () => {
    expect(getAvailableWeeks({})).toEqual([]);
  });

  it('only returns weeks that have at least one game', () => {
    const games = { week1: [{ id: 'g1' }], week2: [] };
    const weeks = getAvailableWeeks(games);
    expect(weeks).toContain(1);
    expect(weeks).not.toContain(2);
  });

  it('returns weeks in ascending order', () => {
    const weeks = getAvailableWeeks(REGULAR_SEASON_GAMES);
    for (let i = 1; i < weeks.length; i++) {
      expect(weeks[i]).toBeGreaterThan(weeks[i - 1]);
    }
  });
});

// ── getDefaultWeek ─────────────────────────────────────────────────────────

describe('getDefaultWeek', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns the last available week when off-season', () => {
    mockDate('2026-06-01');
    const result = getDefaultWeek([13, 14, 15, 16, 17, 18]);
    expect(result).toBe(18);
  });

  it('returns 1 when no weeks are available', () => {
    expect(getDefaultWeek([])).toBe(1);
  });

  it('returns the current week if it exists in available weeks', () => {
    mockDate(new Date(NFL_SEASON.regularSeasonStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString());
    const result = getDefaultWeek([1, 2, 3, 4, 5]);
    expect(result).toBe(2);
  });
});
