import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getAvailableWeeks } from "../data/regularSeasonGames";

function getTeamName(game, side) {
  const candidates =
    side === "away"
      ? [game.awayTeamName, game.awayTeam, game.away, game.awayDisplay]
      : [game.homeTeamName, game.homeTeam, game.home, game.homeDisplay];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c;
  }
  return side === "away" ? "Away" : "Home";
}

function getScoreMeta(game) {
  const a = game.awayScore ?? game.away_score;
  const h = game.homeScore ?? game.home_score;
  const status = game.status || game.gameStatus || "";

  if (a == null || h == null) return status;
  const score = `${a}-${h}`;
  return status ? `${score} · ${status}` : score;
}

const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

export default function Leaderboard({ db, currentUser, regularSeasonGames }) {
  const [users, setUsers] = useState([]);
  const [picksDocs, setPicksDocs] = useState([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [picksLoaded, setPicksLoaded] = useState(false);

  const loading = !usersLoaded || !picksLoaded;

  const allWeeks = getAvailableWeeks(regularSeasonGames);
  const [selectedWeek, setSelectedWeek] = useState(
    allWeeks.length > 0 ? allWeeks[allWeeks.length - 1] : 1
  );

  // Real-time subscriptions to users + picks
  useEffect(() => {
    if (!db) return;

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setUsersLoaded(true);
    });

    const unsubPicks = onSnapshot(collection(db, "picks"), (snap) => {
      setPicksDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setPicksLoaded(true);
    });

    return () => {
      unsubUsers();
      unsubPicks();
    };
  }, [db]);

  // --- OVERALL STANDINGS: total W-L across all weeks ---
  const overallRows = useMemo(() => {
    if (!regularSeasonGames || !users.length) return [];

    const allGames = Object.values(regularSeasonGames).flat();

    return users
      .map((u) => {
        const picksDoc = picksDocs.find((p) => p.id === u.id);
        const picks = picksDoc?.picks || {};
        let wins = 0;
        let losses = 0;

        allGames.forEach((game) => {
          if (!game.winner) return;
          const pick = picks[game.id];
          if (!pick) return;
          if (pick === game.winner) wins++;
          else losses++;
        });

        return {
          userId: u.id,
          displayName: u.displayName?.trim() || u.email?.split("@")[0]?.trim() || `User-${u.id.slice(0, 6)}`,
          wins,
          losses,
        };
      })
      .sort((a, b) => b.wins - a.wins || a.losses - b.losses);
  }, [picksDocs, users, regularSeasonGames]);

  // --- WEEKLY BREAKDOWN ---
  const gamesForWeek = useMemo(() => {
    if (!regularSeasonGames) return [];
    return regularSeasonGames[`week${selectedWeek}`] || [];
  }, [regularSeasonGames, selectedWeek]);

  const weekRows = useMemo(() => {
    if (!gamesForWeek.length || !users.length) return [];

    return users
      .map((u) => {
        const picksDoc = picksDocs.find((p) => p.id === u.id);
        const picks = picksDoc?.picks || {};
        let correct = 0;

        const picksByGame = gamesForWeek.map((game) => {
          const pick = picks[game.id];
          const winner = game.winner;
          let result = "none";
          if (!pick) result = "none";
          else if (!winner) result = "pending";
          else if (pick === winner) { result = "correct"; correct++; }
          else result = "incorrect";

          return { gameId: game.id, pick, result };
        });

        return {
          userId: u.id,
          displayName: u.displayName?.trim() || u.email?.split("@")[0]?.trim() || `User-${u.id.slice(0, 6)}`,
          correct,
          total: gamesForWeek.length,
          picksByGame,
        };
      })
      .sort((a, b) => b.correct - a.correct);
  }, [picksDocs, users, gamesForWeek]);

  if (loading) {
    return (
      <section className="compare-section">
        <div className="compare-loading">
          <div className="loading-spinner" />
          <p>Loading leaderboard…</p>
        </div>
      </section>
    );
  }

  return (
    <section className="compare-section">

      {/* ── OVERALL STANDINGS ── */}
      <div className="overall-standings">
        <h2 className="leaderboard-title">Overall Standings</h2>

        {overallRows.length === 0 ? (
          <div className="compare-empty">
            <p>No picks yet — be the first!</p>
          </div>
        ) : (
          <div className="leaderboard-list">
            {overallRows.map((row, index) => {
              const isCurrentUser = currentUser && row.userId === currentUser.uid;
              const medalColor = MEDAL_COLORS[index] || null;

              return (
                <div
                  key={row.userId}
                  className={`leaderboard-entry${isCurrentUser ? " current-user" : ""}`}
                >
                  <div
                    className="leaderboard-rank"
                    style={medalColor ? { color: medalColor } : undefined}
                  >
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                  </div>
                  <div className="leaderboard-name">{row.displayName}</div>
                  <div className="leaderboard-record">
                    {row.wins}-{row.losses}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="compare-divider" />

      {/* ── WEEK BREAKDOWN ── */}
      <div className="compare-header">
        <h2 className="leaderboard-title">Week {selectedWeek} Breakdown</h2>
        <div className="compare-controls">
          <span className="week-label">Week</span>
          <select
            className="week-select"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
          >
            {allWeeks.map((w) => (
              <option key={w} value={w}>Week {w}</option>
            ))}
          </select>
        </div>
      </div>

      {gamesForWeek.length === 0 || weekRows.length === 0 ? (
        <div className="compare-empty">
          <p>No picks found for this week yet.</p>
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <div className="leaderboard-list" style={{ marginBottom: 16 }}>
            {weekRows.map((row, index) => {
              const isCurrentUser = currentUser && row.userId === currentUser.uid;
              return (
                <div
                  key={row.userId}
                  className={`leaderboard-entry${isCurrentUser ? " current-user" : ""}`}
                >
                  <div className="leaderboard-rank">#{index + 1}</div>
                  <div className="leaderboard-name">{row.displayName}</div>
                  <div className="leaderboard-record">
                    {row.correct}/{row.total}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gantt-style picks grid */}
          <div className="gantt-container">
            {/* Game column headers */}
            <div className="gantt-header-row">
              <div className="gantt-player-col gantt-header-cell">Player</div>
              {gamesForWeek.map((game, idx) => {
                const away = getTeamName(game, "away");
                const home = getTeamName(game, "home");
                const score = getScoreMeta(game);
                const isLive = !game.winner && (game.awayScore !== null || (game.status && game.status.trim()));
                const isDone = !!game.winner;
                return (
                  <div key={game.id} className={`gantt-game-col gantt-header-cell${isLive ? " gantt-col-live" : ""}${isDone ? " gantt-col-done" : ""}`}>
                    <span className="gantt-game-num">G{idx + 1}</span>
                    <span className="gantt-game-teams">{away} @ {home}</span>
                    {score && <span className="gantt-game-score">{score}</span>}
                    {isLive && <span className="gantt-live-dot" />}
                  </div>
                );
              })}
            </div>

            {/* Player rows */}
            {weekRows.map((row, rowIdx) => {
              const isCurrentUser = currentUser && row.userId === currentUser.uid;
              return (
                <div
                  key={row.userId}
                  className={`gantt-player-row${isCurrentUser ? " gantt-row-me" : ""}${rowIdx % 2 === 0 ? " gantt-row-even" : ""}`}
                >
                  <div className="gantt-player-col gantt-player-name">
                    <span className="gantt-rank">#{rowIdx + 1}</span>
                    {row.displayName}
                    <span className="gantt-score-pill">{row.correct}/{row.total}</span>
                  </div>
                  {row.picksByGame.map((p) => (
                    <div
                      key={p.gameId}
                      className={`gantt-game-col gantt-pick-cell gantt-pick-${p.result}`}
                    >
                      {p.result === "correct" && <span className="gantt-icon">✓</span>}
                      {p.result === "incorrect" && <span className="gantt-icon">✗</span>}
                      {p.result === "pending" && <span className="gantt-icon gantt-pending-dot" />}
                      <span className="gantt-pick-name">{p.pick || "—"}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
