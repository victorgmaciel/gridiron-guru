import { useState, useMemo } from "react";
import {
  getAvailableWeeks,
  getDefaultWeek,
  isOffSeason,
  NFL_SEASON,
} from "../data/regularSeasonGames";

function OffSeasonScreen() {
  const start = NFL_SEASON.regularSeasonStart;
  const formatted = start.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Simple countdown in days
  const daysUntil = Math.ceil((start - new Date()) / (1000 * 60 * 60 * 24));
  const countdownText =
    daysUntil > 0
      ? `${daysUntil} day${daysUntil !== 1 ? "s" : ""} away`
      : "Season is underway!";

  return (
    <div className="offseason-screen">
      <div className="offseason-ball">🏈</div>
      <h2 className="offseason-title">Off-Season</h2>
      <p className="offseason-subtitle">
        The {NFL_SEASON.year} NFL season kicks off on
      </p>
      <div className="offseason-date">{formatted}</div>
      <div className="offseason-countdown">{countdownText}</div>
      <p className="offseason-hint">
        Check back when the schedule drops to lock in your picks before Week 1.
      </p>
    </div>
  );
}

export default function RegularSeasonPicks({
  regularSeasonGames,
  userPicks,
  handlePick,
  isWeekLocked,
}) {
  const availableWeeks = useMemo(
    () => getAvailableWeeks(regularSeasonGames),
    [regularSeasonGames]
  );

  const defaultWeek = useMemo(
    () => getDefaultWeek(availableWeeks),
    [availableWeeks]
  );

  const [selectedWeek, setSelectedWeek] = useState(null);

  // Resolve the week to display — use state if set, else auto-default
  const week = selectedWeek ?? defaultWeek;
  const locked = isWeekLocked ? isWeekLocked(week) : false;
  const currentWeekGames = regularSeasonGames[`week${week}`] || [];

  // Show off-season screen if no games exist and we're outside the season
  if (availableWeeks.length === 0 && isOffSeason()) {
    return <OffSeasonScreen />;
  }

  const getGameState = (game) => {
    if (game.winner) return "finished";
    if (game.awayScore !== null && game.awayScore !== undefined) return "live";
    return "upcoming";
  };

  return (
    <div className="picks-container">
      {/* Week Selector */}
      {availableWeeks.length > 1 && (
        <div className="week-selector">
          <label htmlFor="week-select" className="week-label">Week</label>
          <select
            id="week-select"
            value={week}
            onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
            className="week-dropdown"
          >
            {availableWeeks.map((w) => (
              <option key={w} value={w}>
                Week {w}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Lock Banner */}
      {locked && (
        <div className="locked-banner">
          🔒 PICKS LOCKED — Week {week} is underway
        </div>
      )}

      <div className="week-games">
        <h2 className="week-title">Week {week}</h2>

        {currentWeekGames.length === 0 ? (
          <div className="empty-state">
            No games scheduled for this week yet.
          </div>
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
                        {/* Header: matchup + status */}
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

                        {/* Score row */}
                        {(gameState === "live" || gameState === "finished") &&
                          game.awayScore !== null &&
                          game.homeScore !== null && (
                            <div className="game-score-row">
                              <span className="game-score-display">
                                {game.awayScore} — {game.homeScore}
                              </span>
                            </div>
                          )}

                        {/* Team buttons */}
                        <div className="game-teams">
                          {[game.away, game.home].map((team) => {
                            const isSelected = userPick === team;
                            const isWinner = game.winner === team;
                            const isLoser = game.winner && game.winner !== team;

                            return (
                              <button
                                key={team}
                                className={[
                                  "team-button",
                                  isSelected ? "selected" : "",
                                  isWinner ? "winner" : "",
                                  isLoser ? "loser" : "",
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                                onClick={() =>
                                  !locked && handlePick(game.id, team)
                                }
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
