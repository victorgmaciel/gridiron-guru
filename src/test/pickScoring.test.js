import { describe, it, expect } from 'vitest';

// ── Scoring logic extracted for unit testing ───────────────────────────────
// This mirrors the logic in Leaderboard.jsx so we can verify it independently.

function scoreAllGames(games, picks) {
  let wins = 0;
  let losses = 0;
  games.forEach((game) => {
    if (!game.winner) return;
    const pick = picks[game.id];
    if (!pick) return;
    if (pick === game.winner) wins++;
    else losses++;
  });
  return { wins, losses };
}

function getPickResult(game, pick) {
  if (!pick) return 'none';
  if (!game.winner) return 'pending';
  return pick === game.winner ? 'correct' : 'incorrect';
}

// ── scoreAllGames ──────────────────────────────────────────────────────────

describe('scoreAllGames', () => {
  const games = [
    { id: 'g1', winner: 'Chiefs' },
    { id: 'g2', winner: 'Eagles' },
    { id: 'g3', winner: null },
    { id: 'g4', winner: 'Lions' },
  ];

  it('counts correct picks as wins', () => {
    const { wins } = scoreAllGames(games, { g1: 'Chiefs', g2: 'Eagles' });
    expect(wins).toBe(2);
  });

  it('counts wrong picks as losses', () => {
    const { losses } = scoreAllGames(games, { g1: 'Bills', g2: 'Cowboys' });
    expect(losses).toBe(2);
  });

  it('ignores games with no winner yet', () => {
    const { wins, losses } = scoreAllGames(games, { g3: 'Ravens' });
    expect(wins).toBe(0);
    expect(losses).toBe(0);
  });

  it('ignores games the user did not pick', () => {
    const { wins, losses } = scoreAllGames(games, {});
    expect(wins).toBe(0);
    expect(losses).toBe(0);
  });

  it('handles mixed results correctly', () => {
    const result = scoreAllGames(games, {
      g1: 'Chiefs',  // correct
      g2: 'Cowboys', // wrong
      g4: 'Lions',   // correct
    });
    expect(result.wins).toBe(2);
    expect(result.losses).toBe(1);
  });
});

// ── getPickResult ──────────────────────────────────────────────────────────

describe('getPickResult', () => {
  it('returns "none" when user made no pick', () => {
    expect(getPickResult({ id: 'g1', winner: 'Chiefs' }, null)).toBe('none');
    expect(getPickResult({ id: 'g1', winner: 'Chiefs' }, undefined)).toBe('none');
  });

  it('returns "pending" when game has no winner yet', () => {
    expect(getPickResult({ id: 'g1', winner: null }, 'Chiefs')).toBe('pending');
  });

  it('returns "correct" when pick matches winner', () => {
    expect(getPickResult({ id: 'g1', winner: 'Chiefs' }, 'Chiefs')).toBe('correct');
  });

  it('returns "incorrect" when pick does not match winner', () => {
    expect(getPickResult({ id: 'g1', winner: 'Chiefs' }, 'Bills')).toBe('incorrect');
  });
});

// ── lock logic ─────────────────────────────────────────────────────────────

describe('isWeekLocked', () => {
  function isWeekLocked(games) {
    return games.some(
      (g) => g.winner !== null || g.awayScore !== null || (g.status && g.status.trim() !== '')
    );
  }

  it('is not locked when all games are upcoming', () => {
    const games = [
      { winner: null, awayScore: null, status: '' },
      { winner: null, awayScore: null, status: '' },
    ];
    expect(isWeekLocked(games)).toBe(false);
  });

  it('locks when any game has a winner', () => {
    const games = [
      { winner: 'Chiefs', awayScore: null, status: '' },
      { winner: null, awayScore: null, status: '' },
    ];
    expect(isWeekLocked(games)).toBe(true);
  });

  it('locks when any game has a score', () => {
    const games = [
      { winner: null, awayScore: 14, status: '' },
    ];
    expect(isWeekLocked(games)).toBe(true);
  });

  it('locks when any game has a non-empty status', () => {
    const games = [
      { winner: null, awayScore: null, status: 'Q2 7:23' },
    ];
    expect(isWeekLocked(games)).toBe(true);
  });

  it('does not lock on whitespace-only status', () => {
    const games = [
      { winner: null, awayScore: null, status: '   ' },
    ];
    expect(isWeekLocked(games)).toBe(false);
  });
});
