import { useState } from "react";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { getApp } from "firebase/app";

const db = getFirestore(getApp());

export default function AdminPanel({
  playoffGames,
  regularSeasonGames,
  availableWeeks,
  handleUpdatePlayoffGame,
  handleUpdateRegularSeasonGame,
}) {
  const [adminView, setAdminView] = useState("regular");
  const [selectedWeek, setSelectedWeek] = useState(availableWeeks[0] || 13);

  const currentWeekGames = regularSeasonGames[`week${selectedWeek}`] || [];

  return (
    <div className="admin-container">
      <h2 className="admin-title">Manage Games & Scores</h2>

      {/* Toggle between Regular Season and Playoff */}
      <div className="admin-toggle">
        <button
          className={`toggle-button ${adminView === "regular" ? "active" : ""}`}
          onClick={() => setAdminView("regular")}
        >
          REGULAR SEASON
        </button>
        <button
          className={`toggle-button ${adminView === "playoff" ? "active" : ""}`}
          onClick={() => setAdminView("playoff")}
        >
          PLAYOFFS
        </button>
      </div>

      {/* Regular Season Admin */}
      {adminView === "regular" && (
        <>
          {/* ------------------------------- */}
          {/* Upload Button (NEW)             */}
          {/* ------------------------------- */}
          <button
            onClick={async () => {
              try {
                // Lazy imports avoid circular dependency issues
                const { updateDoc, doc } = await import("firebase/firestore");
                const { REGULAR_SEASON_GAMES } = await import(
                  "../data/regularSeasonGames"
                );

                await updateDoc(doc(db, "config", "regular-season-games"), {
                  games: REGULAR_SEASON_GAMES,
                });

                alert("Regular season games uploaded to Firestore!");
              } catch (err) {
                console.error("Upload error:", err);
                alert("Failed to upload regular season games.");
              }
            }}
            style={{
              padding: "14px 20px",
              background: "rgba(57,255,20,0.15)",
              border: "2px solid var(--neon-green)",
              borderRadius: "12px",
              color: "var(--neon-green)",
              fontWeight: "700",
              width: "100%",
              marginBottom: "20px",
              boxShadow: "0 0 12px rgba(57,255,20,0.25)",
              cursor: "pointer",
            }}
          >
            📤 Upload Regular Season Schedule to Firestore
          </button>

          {/* ------------------------------- */}
          {/* Week Selector                   */}
          {/* ------------------------------- */}
          <div className="week-selector">
            <label htmlFor="admin-week-select" className="week-label">
              SELECT WEEK:
            </label>
            <select
              id="admin-week-select"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
              className="week-dropdown"
            >
              {availableWeeks.map((week) => (
                <option key={week} value={week}>
                  Week {week}
                </option>
              ))}
            </select>
          </div>

          {/* ------------------------------- */}
          {/* Games                          */}
          {/* ------------------------------- */}
          {currentWeekGames.map((game) => (
            <div key={game.id} className="admin-game-card">
              <div className="admin-game-header">
                {game.away} @ {game.home} ({game.day} {game.time})
              </div>

              <div className="admin-inputs">
                {/* Away Team */}
                <div className="admin-input-row">
                  <label className="admin-label">Away Team:</label>
                  <input
                    type="text"
                    value={game.away}
                    onChange={(e) =>
                      handleUpdateRegularSeasonGame(
                        selectedWeek,
                        game.id,
                        "away",
                        e.target.value
                      )
                    }
                    className="admin-input"
                  />
                </div>

                {/* Home Team */}
                <div className="admin-input-row">
                  <label className="admin-label">Home Team:</label>
                  <input
                    type="text"
                    value={game.home}
                    onChange={(e) =>
                      handleUpdateRegularSeasonGame(
                        selectedWeek,
                        game.id,
                        "home",
                        e.target.value
                      )
                    }
                    className="admin-input"
                  />
                </div>

                {/* Score Row */}
                <div className="admin-score-row">
                  <div className="admin-score-input">
                    <label className="admin-label">Away Score:</label>
                    <input
                      type="number"
                      value={game.awayScore ?? ""}
                      onChange={(e) =>
                        handleUpdateRegularSeasonGame(
                          selectedWeek,
                          game.id,
                          "awayScore",
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="admin-input-small"
                    />
                  </div>

                  <div className="admin-score-input">
                    <label className="admin-label">Home Score:</label>
                    <input
                      type="number"
                      value={game.homeScore ?? ""}
                      onChange={(e) =>
                        handleUpdateRegularSeasonGame(
                          selectedWeek,
                          game.id,
                          "homeScore",
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="admin-input-small"
                    />
                  </div>
                </div>

                {/* Winner */}
                <div className="admin-input-row">
                  <label className="admin-label">Winner:</label>
                  <select
                    value={game.winner || ""}
                    onChange={(e) =>
                      handleUpdateRegularSeasonGame(
                        selectedWeek,
                        game.id,
                        "winner",
                        e.target.value || null
                      )
                    }
                    className="admin-select"
                  >
                    <option value="">No Winner Yet</option>
                    <option value={game.away}>{game.away}</option>
                    <option value={game.home}>{game.home}</option>
                  </select>
                </div>

                {game.winner && (
                  <div className="admin-status">
                    ✓ Winner set: {game.winner}
                    {game.awayScore !== null &&
                      game.homeScore !== null &&
                      ` (${game.awayScore}-${game.homeScore})`}
                  </div>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Playoff Admin */}
      {adminView === "playoff" && (
        <>
          {playoffGames.map((game) => (
            <div key={game.id} className="admin-game-card">
              <div className="admin-game-header">{game.matchup}</div>

              <div className="admin-inputs">
                {/* Away */}
                <div className="admin-input-row">
                  <label className="admin-label">Away Team:</label>
                  <input
                    type="text"
                    value={game.away}
                    onChange={(e) =>
                      handleUpdatePlayoffGame(game.id, "away", e.target.value)
                    }
                    className="admin-input"
                  />
                </div>

                {/* Home */}
                <div className="admin-input-row">
                  <label className="admin-label">Home Team:</label>
                  <input
                    type="text"
                    value={game.home}
                    onChange={(e) =>
                      handleUpdatePlayoffGame(game.id, "home", e.target.value)
                    }
                    className="admin-input"
                  />
                </div>

                {/* Score Row */}
                <div className="admin-score-row">
                  <div className="admin-score-input">
                    <label className="admin-label">Away Score:</label>
                    <input
                      type="number"
                      value={game.awayScore ?? ""}
                      onChange={(e) =>
                        handleUpdatePlayoffGame(
                          game.id,
                          "awayScore",
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="admin-input-small"
                    />
                  </div>

                  <div className="admin-score-input">
                    <label className="admin-label">Home Score:</label>
                    <input
                      type="number"
                      value={game.homeScore ?? ""}
                      onChange={(e) =>
                        handleUpdatePlayoffGame(
                          game.id,
                          "homeScore",
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="admin-input-small"
                    />
                  </div>
                </div>

                {/* Winner */}
                <div className="admin-input-row">
                  <label className="admin-label">Winner:</label>
                  <select
                    value={game.winner || ""}
                    onChange={(e) =>
                      handleUpdatePlayoffGame(
                        game.id,
                        "winner",
                        e.target.value || null
                      )
                    }
                    className="admin-select"
                  >
                    <option value="">No Winner Yet</option>
                    <option value={game.away}>{game.away}</option>
                    <option value={game.home}>{game.home}</option>
                  </select>
                </div>

                {game.winner && (
                  <div className="admin-status">
                    ✓ Winner set: {game.winner}
                    {game.awayScore !== null &&
                      game.homeScore !== null &&
                      ` (${game.awayScore}-${game.homeScore})`}
                  </div>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
