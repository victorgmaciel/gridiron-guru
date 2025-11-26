import { useState } from "react";

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

          {currentWeekGames.map((game) => (
            <div key={game.id} className="admin-game-card">
              <div className="admin-game-header">
                {game.away} @ {game.home} ({game.day} {game.time})
              </div>

              <div className="admin-inputs">
                <div className="admin-input-row">
                  <label className="admin-label">Away Team:</label>
                  <input
                    type="text"
                    placeholder="Away Team"
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

                <div className="admin-input-row">
                  <label className="admin-label">Home Team:</label>
                  <input
                    type="text"
                    placeholder="Home Team"
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

                <div className="admin-score-row">
                  <div className="admin-score-input">
                    <label className="admin-label">Away Score:</label>
                    <input
                      type="number"
                      placeholder="0"
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
                      placeholder="0"
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
                <div className="admin-input-row">
                  <label className="admin-label">Away Team:</label>
                  <input
                    type="text"
                    placeholder="Away Team"
                    value={game.away}
                    onChange={(e) =>
                      handleUpdatePlayoffGame(game.id, "away", e.target.value)
                    }
                    className="admin-input"
                  />
                </div>

                <div className="admin-input-row">
                  <label className="admin-label">Home Team:</label>
                  <input
                    type="text"
                    placeholder="Home Team"
                    value={game.home}
                    onChange={(e) =>
                      handleUpdatePlayoffGame(game.id, "home", e.target.value)
                    }
                    className="admin-input"
                  />
                </div>

                <div className="admin-score-row">
                  <div className="admin-score-input">
                    <label className="admin-label">Away Score:</label>
                    <input
                      type="number"
                      placeholder="0"
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
                      placeholder="0"
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
