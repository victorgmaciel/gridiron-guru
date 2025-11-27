import { useState } from "react";

export default function RegularSeasonPicks({
  regularSeasonGames,
  userPicks,
  handlePick,
  availableWeeks,
  isWeekLocked, // 👈 new
}) {
  const [selectedWeek, setSelectedWeek] = useState(availableWeeks[0] || 13);

  const currentWeekGames = regularSeasonGames[`week${selectedWeek}`] || [];
  const locked = isWeekLocked ? isWeekLocked(selectedWeek) : false;

  return (
    <div className="picks-container">
      {/* Week Selector */}
      <div className="week-selector">
        <label htmlFor="week-select" className="week-label">
          SELECT WEEK:
        </label>
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

      <div className="week-games">
        <h2 className="week-title">Week {selectedWeek}</h2>

        {locked && (
          <div className="empty-state">
            Picks for Week {selectedWeek} are locked. You can no longer make
            changes.
          </div>
        )}

        {currentWeekGames.length === 0 ? (
          <div className="empty-state">
            No games scheduled for this week yet.
          </div>
        ) : (
          <>
            {["Thursday", "Friday", "Sunday", "Monday"].map((day) => {
              const dayGames = currentWeekGames.filter((g) => g.day === day);
              if (dayGames.length === 0) return null;

              return (
                <div key={day} className="day-section">
                  <h3 className="day-title">{day}</h3>
                  {dayGames.map((game) => (
                    <div key={game.id} className="game-card">
                      <div className="game-header">
                        <span className="game-matchup">
                          {game.away} @ {game.home}
                        </span>
                        <span className="game-time">{game.time}</span>
                      </div>
                      <div className="game-teams">
                        <button
                          className={`team-button ${
                            userPicks[game.id] === game.away ? "selected" : ""
                          } ${
                            game.winner === game.away
                              ? "winner"
                              : game.winner
                              ? "loser"
                              : ""
                          }`}
                          onClick={() =>
                            !locked && handlePick(game.id, game.away)
                          }
                          disabled={locked || game.winner !== null}
                        >
                          <span className="team-name">{game.away}</span>
                          {userPicks[game.id] === game.away && (
                            <span className="pick-indicator">✓</span>
                          )}
                        </button>
                        <button
                          className={`team-button ${
                            userPicks[game.id] === game.home ? "selected" : ""
                          } ${
                            game.winner === game.home
                              ? "winner"
                              : game.winner
                              ? "loser"
                              : ""
                          }`}
                          onClick={() =>
                            !locked && handlePick(game.id, game.home)
                          }
                          disabled={locked || game.winner !== null}
                        >
                          <span className="team-name">{game.home}</span>
                          {userPicks[game.id] === game.home && (
                            <span className="pick-indicator">✓</span>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
