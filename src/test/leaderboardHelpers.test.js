import { describe, it, expect } from 'vitest';

// Mirrors helper functions from Leaderboard.jsx

function getTeamName(game, side) {
  const candidates =
    side === 'away'
      ? [game.awayTeamName, game.awayTeam, game.away, game.awayDisplay]
      : [game.homeTeamName, game.homeTeam, game.home, game.homeDisplay];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c;
  }
  return side === 'away' ? 'Away' : 'Home';
}

function getScoreMeta(game) {
  const a = game.awayScore ?? game.away_score;
  const h = game.homeScore ?? game.home_score;
  const status = game.status || game.gameStatus || '';
  if (a == null || h == null) return status;
  const score = `${a}-${h}`;
  return status ? `${score} · ${status}` : score;
}

function getDisplayName(user) {
  return user?.displayName?.trim() || user?.email?.trim() || 'Anonymous';
}

// ── getTeamName ────────────────────────────────────────────────────────────

describe('getTeamName', () => {
  it('returns away team name from "away" field', () => {
    expect(getTeamName({ away: 'Chiefs' }, 'away')).toBe('Chiefs');
  });

  it('returns home team name from "home" field', () => {
    expect(getTeamName({ home: 'Eagles' }, 'home')).toBe('Eagles');
  });

  it('prefers awayTeamName over away', () => {
    expect(getTeamName({ awayTeamName: 'Kansas City Chiefs', away: 'Chiefs' }, 'away')).toBe('Kansas City Chiefs');
  });

  it('falls back to "Away" when no away field', () => {
    expect(getTeamName({}, 'away')).toBe('Away');
  });

  it('falls back to "Home" when no home field', () => {
    expect(getTeamName({}, 'home')).toBe('Home');
  });

  it('skips empty string candidates', () => {
    expect(getTeamName({ away: '', awayTeam: 'Chiefs' }, 'away')).toBe('Chiefs');
  });
});

// ── getScoreMeta ───────────────────────────────────────────────────────────

describe('getScoreMeta', () => {
  it('returns empty string when no score and no status', () => {
    expect(getScoreMeta({ awayScore: null, homeScore: null, status: '' })).toBe('');
  });

  it('returns status when no score', () => {
    expect(getScoreMeta({ awayScore: null, homeScore: null, status: 'Final' })).toBe('Final');
  });

  it('returns score string when both scores present', () => {
    expect(getScoreMeta({ awayScore: 14, homeScore: 21, status: '' })).toBe('14-21');
  });

  it('combines score and status', () => {
    expect(getScoreMeta({ awayScore: 7, homeScore: 3, status: 'Q2 4:12' })).toBe('7-3 · Q2 4:12');
  });

  it('uses away_score / home_score as fallback field names', () => {
    expect(getScoreMeta({ away_score: 10, home_score: 20, status: '' })).toBe('10-20');
  });
});

// ── getDisplayName ─────────────────────────────────────────────────────────

describe('getDisplayName', () => {
  it('returns displayName when set', () => {
    expect(getDisplayName({ displayName: 'Victor', email: 'v@test.com' })).toBe('Victor');
  });

  it('falls back to email when displayName is empty', () => {
    expect(getDisplayName({ displayName: '', email: 'v@test.com' })).toBe('v@test.com');
  });

  it('falls back to email when displayName is whitespace', () => {
    expect(getDisplayName({ displayName: '   ', email: 'v@test.com' })).toBe('v@test.com');
  });

  it('falls back to Anonymous when both are missing', () => {
    expect(getDisplayName({ displayName: '', email: '' })).toBe('Anonymous');
  });

  it('returns Anonymous for null user', () => {
    expect(getDisplayName(null)).toBe('Anonymous');
  });
});
