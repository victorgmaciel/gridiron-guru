import { useState } from "react";

export default function RegularSeasonPicks({
  regularSeasonGames,
  userPicks,
  handlePick,
  availableWeeks,
  isWeekLocked,
}) {
  const [selectedWeek, setSelectedWeek] = useState(availableWeeks[0] || 13);

  const currentWeekGames = regularSeasonGames[`week${selectedWeek}`] || [];
  const locked = isWeekLocked ? isWeekLocked(selectedWeek) : false;

  const getGameState = (game) => {
    if (game.winner) return "finished";
    if (game.awayScore !== null && game.awayScore !== undefined) return "live";
    return "upcoming";
  };

  return (
    <div className="picks-container">
      {/* Week Selector */}
      <div className="week-selector">
        <label htmlFor="week-select" className="week-label">Week</label>
        <select
          id="week-select"
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

      {/* Lock Banner */}
      {locked && (
        <div className="locked-banner">
          🔒 PICKS LOCKED — Week {selectedWeek} is underway
        </div>
      )}

      <div className="week-games">
        <h2 className="week-title">Week {selectedWeek}</h2>

        {currentWeekGames.length === 0 ? (
          <div className="empty-state">No games scheduled for this week yet.</div>
        ) : (
          <>
            {["Thursday", "Friday", "Saturday", "Sunday", "Monday"].map((day) => {
              const dayGames = currentWeekGames.filter((g) => g.day === day);
              if (dayGames.length === 0) return null;

              return (
                <div key={day} className="day-section">
                  <h3 className="day-title">{day}</h3>

                  {dayGames.map((game) => {
                    const gameState = getGameState(game);
                    const userPick = userPicks[game.id];

                    const cardClass = [
                      "game-card",
                      gameState === "live" ? "game-card--live" : "",
                      gameState === "finished" ? "game-card--finished" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <div key={game.id} className={cardClass}>
                        {/* Header row: matchup + time */}
                        <div className="game-header-top">
                          <span className="game-matchup">
                            {game.away} @ {game.home}
                          </span>
                          {gameState === "upcoming" && (
                            <span className="game-time">{game.time}</span>
                          )}
                          {gameState === "live" && (
                            <span className="status-badge status-live">LIVE</span>
                          )}
                          {gameState === "finished" && (
                            <span className="status-badge status-final">FINAL</span>
                          )}
                        </div>

                        {/* Score row (live or final) */}
                        {(gameState === "live" || gameState === "finished") &&
                          game.awayScore !== null &&
                          game.homeScore !== null && (
                            <div className="game-score-row">
                              <span className="game-score-display">
                                {game.awayScore} — {game.homeScore}
                              </span>
                            </div>
                          )}

                        {/* Team pick buttons */}
                        <div className="game-teams">
                          {[
                            { team: game.away, side: "away" },
                            { team: game.home, side: "home" },
                          ].map(({ team }) => {
                            const isSelected = userPick === team;
                            const isWinner = game.winner === team;
                            const isLoser =
                              game.winner && game.winner !== team;

                            const btnClass = [
                              "team-button",
                              isSelected ? "selected" : "",
                              isWinner ? "winner" : "",
                              isLoser ? "loser" : "",
                            ]
                              .filter(Boolean)
                              .join(" ");

                            return (
                              <button
                                key={team}
                                className={btnClass}
                                onClick={() => !locked && handlePick(game.id, team)}
                                disabled={locked}
                              >
                                <span className="team-name">{team}</span>
                                {isSelected && (
                                  <span className="pick-indicator">
                                    {isWinner ? "✓" : isLoser ? "✗" : "●"}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
