import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getAvailableWeeks } from "../data/regularSeasonGames";

function getTeamName(game, side) {
  // Try a bunch of likely field names so it "just works"
  const candidates =
    side === "away"
      ? [
          game.awayTeamName,
          game.awayTeam,
          game.away,
          game.awayDisplay,
          game.away_full,
        ]
      : [
          game.homeTeamName,
          game.homeTeam,
          game.home,
          game.homeDisplay,
          game.home_full,
        ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c;
  }
  return side === "away" ? "Away" : "Home";
}

export default function Leaderboard({ db, currentUser, regularSeasonGames }) {
  const [users, setUsers] = useState([]);
  const [picksDocs, setPicksDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const allWeeks = getAvailableWeeks();
  const [selectedWeek, setSelectedWeek] = useState(
    allWeeks.length > 0 ? allWeeks[0] : 1
  );

  // Subscribe to users and picks
  useEffect(() => {
    if (!db) return;

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });

    const unsubPicks = onSnapshot(collection(db, "picks"), (snap) => {
      setPicksDocs(
        snap.docs.map((doc) => ({
          id: doc.id, // userId
          ...doc.data(),
        }))
      );
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubPicks();
    };
  }, [db]);

  // Games for selected week
  const gamesForWeek = useMemo(() => {
    if (!regularSeasonGames) return [];
    const weekKey = `week${selectedWeek}`;
    return regularSeasonGames[weekKey] || [];
  }, [regularSeasonGames, selectedWeek]);

  // Build rows: one per user
  const rows = useMemo(() => {
    if (!gamesForWeek.length) return [];

    return picksDocs
      .map((p) => {
        const user = users.find((u) => u.id === p.id);
        const picks = p.picks || {}; // flat { [gameId]: "Lions" }

        let correct = 0;

        const picksByGame = gamesForWeek.map((game) => {
          const pick = picks[game.id];
          const winner = game.winner; // may be undefined if not decided

          let result = "none";

          if (!pick) {
            result = "none";
          } else if (!winner) {
            result = "pending";
          } else if (pick === winner) {
            result = "correct";
            correct += 1;
          } else {
            result = "incorrect";
          }

          return {
            gameId: game.id,
            pick,
            result,
          };
        });

        return {
          userId: p.id,
          displayName: user?.displayName || user?.email || "Anonymous",
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

  if (!rows.length || !gamesForWeek.length) {
    return (
      <section className="compare-section">
        <div className="compare-empty">
          <p>No picks found for this week yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="compare-section">
      {/* Header + week selector */}
      <div className="compare-header">
        <h2 className="leaderboard-title">Week {selectedWeek} Leaderboard</h2>

        <div className="compare-controls">
          <span className="week-label">Week</span>
          <select
            className="week-select"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
          >
            {allWeeks.map((w) => (
              <option key={w} value={w}>
                Week {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary leaderboard strip */}
      <div className="leaderboard-container" style={{ marginBottom: "16px" }}>
        <div className="leaderboard-list">
          {rows.map((row, index) => {
            const isCurrentUser = currentUser && row.userId === currentUser.uid;
            return (
              <div
                key={row.userId}
                className={
                  "leaderboard-entry" + (isCurrentUser ? " current-user" : "")
                }
              >
                <div className="leaderboard-rank">#{index + 1}</div>
                <div className="leaderboard-name">{row.displayName}</div>
                <div className="leaderboard-score">
                  {row.correct}/{row.total}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compare picks table */}
      <div className="compare-table-container">
        <table className="compare-table">
          <thead>
            <tr>
              <th className="compare-th-user">Player</th>
              {gamesForWeek.map((game, idx) => {
                const awayName = getTeamName(game, "away");
                const homeName = getTeamName(game, "home");
                return (
                  <th key={game.id} className="compare-th-game">
                    <div className="game-header">
                      <span className="game-meta">
                        Game {idx + 1}
                        {game.points ? ` · ${game.points}pt` : ""}
                      </span>
                      <div className="game-teams-line">
                        <span className="team-away">{awayName}</span>
                        <span className="at-symbol">@</span>
                        <span className="team-home">{homeName}</span>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isCurrentUser =
                currentUser && row.userId === currentUser.uid;
              return (
                <tr
                  key={row.userId}
                  className={
                    "compare-row" + (isCurrentUser ? " current-user" : "")
                  }
                >
                  <td className="compare-td-user">{row.displayName}</td>
                  {row.picksByGame.map((p) => {
                    const classes = ["compare-td-pick"];
                    if (p.result === "correct") classes.push("pick-correct");
                    if (p.result === "incorrect")
                      classes.push("pick-incorrect");

                    return (
                      <td key={p.gameId} className={classes.join(" ")}>
                        <span className="pick-text">
                          {p.pick ? p.pick : "—"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
