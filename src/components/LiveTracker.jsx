import { useState } from "react";

export default function LiveTracker({
  regularSeasonGames,
  playoffGames,
  userPicks,
  availableWeeks,
  user,
}) {
  const [viewMode, setViewMode] = useState("regular"); // 'regular' or 'playoff'
  const [selectedWeek, setSelectedWeek] = useState(availableWeeks[0] || 13);

  const currentWeekGames = regularSeasonGames[`week${selectedWeek}`] || [];
  const gamesToShow = viewMode === "regular" ? currentWeekGames : playoffGames;

  // Calculate if user picked correctly
  const getPickStatus = (game) => {
    const userPick = userPicks[game.id];
    if (!userPick) return "no-pick";
    if (!game.winner) return "pending";
    return userPick === game.winner ? "correct" : "incorrect";
  };

  // Get score display
  const getScoreDisplay = (game) => {
    if (game.awayScore !== null && game.homeScore !== null) {
      return `${game.awayScore} - ${game.homeScore}`;
    }
    if (game.winner) {
      return "Final";
    }
    return game.time;
  };

  return (
    <div className="live-tracker-container">
      {/* Mode Toggle */}
      <div className="tracker-toggle">
        <button
          className={`toggle-button ${viewMode === "regular" ? "active" : ""}`}
          onClick={() => setViewMode("regular")}
        >
          REGULAR SEASON
        </button>
        <button
          className={`toggle-button ${viewMode === "playoff" ? "active" : ""}`}
          onClick={() => setViewMode("playoff")}
        >
          PLAYOFFS
        </button>
      </div>

      {/* Week Selector for Regular Season */}
      {viewMode === "regular" && (
        <div className="week-selector">
          <label htmlFor="tracker-week-select" className="week-label">
            WEEK:
          </label>
          <select
            id="tracker-week-select"
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
      )}

      {/* Games List */}
      <div className="tracker-games">
        {gamesToShow.length === 0 ? (
          <div className="empty-state">No games available</div>
        ) : (
          <>
            {viewMode === "regular"
              ? // Group by day for regular season
                ["Thursday", "Friday", "Saturday", "Sunday", "Monday"].map(
                  (day) => {
                    const dayGames = gamesToShow.filter((g) => g.day === day);
                    if (dayGames.length === 0) return null;

                    return (
                      <div key={day} className="tracker-day-section">
                        <h3 className="tracker-day-title">{day}</h3>
                        {dayGames.map((game) => {
                          const pickStatus = getPickStatus(game);
                          const userPick = userPicks[game.id];

                          return (
                            <div
                              key={game.id}
                              className={`tracker-game-card ${pickStatus}`}
                            >
                              <div className="tracker-game-header">
                                <span className="tracker-matchup">
                                  {game.away} @ {game.home}
                                </span>
                                <span className="tracker-score">
                                  {getScoreDisplay(game)}
                                </span>
                              </div>

                              <div className="tracker-picks-row">
                                <div className="tracker-pick-status">
                                  {!userPick && (
                                    <span className="no-pick-text">
                                      No pick
                                    </span>
                                  )}
                                  {userPick && !game.winner && (
                                    <span className="pending-pick">
                                      You picked: <strong>{userPick}</strong>
                                    </span>
                                  )}
                                  {userPick &&
                                    game.winner &&
                                    pickStatus === "correct" && (
                                      <span className="correct-pick">
                                        ✓ {userPick} - Correct! (+{game.points}{" "}
                                        pt)
                                      </span>
                                    )}
                                  {userPick &&
                                    game.winner &&
                                    pickStatus === "incorrect" && (
                                      <span className="incorrect-pick">
                                        ✗ {userPick} - Incorrect
                                      </span>
                                    )}
                                </div>

                                {game.winner && (
                                  <div className="tracker-winner">
                                    Winner: <strong>{game.winner}</strong>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                )
              : // Group by round for playoffs
                (() => {
                  const groupedGames = gamesToShow.reduce((acc, game) => {
                    if (!acc[game.round]) acc[game.round] = [];
                    acc[game.round].push(game);
                    return acc;
                  }, {});

                  return Object.entries(groupedGames).map(
                    ([round, roundGames]) => (
                      <div key={round} className="tracker-round-section">
                        <h3 className="tracker-round-title">{round}</h3>
                        {roundGames.map((game) => {
                          const pickStatus = getPickStatus(game);
                          const userPick = userPicks[game.id];

                          return (
                            <div
                              key={game.id}
                              className={`tracker-game-card ${pickStatus}`}
                            >
                              <div className="tracker-game-header">
                                <span className="tracker-matchup">
                                  {game.matchup}
                                </span>
                                <span className="tracker-points">
                                  {game.points} PT{game.points > 1 ? "S" : ""}
                                </span>
                              </div>

                              <div className="tracker-teams-row">
                                <div className="tracker-team">{game.away}</div>
                                <div className="tracker-vs">vs</div>
                                <div className="tracker-team">{game.home}</div>
                              </div>

                              {game.awayScore !== null &&
                                game.homeScore !== null && (
                                  <div className="tracker-score-display">
                                    {game.away} {game.awayScore} -{" "}
                                    {game.homeScore} {game.home}
                                  </div>
                                )}

                              <div className="tracker-picks-row">
                                <div className="tracker-pick-status">
                                  {!userPick && (
                                    <span className="no-pick-text">
                                      No pick
                                    </span>
                                  )}
                                  {userPick && !game.winner && (
                                    <span className="pending-pick">
                                      You picked: <strong>{userPick}</strong>
                                    </span>
                                  )}
                                  {userPick &&
                                    game.winner &&
                                    pickStatus === "correct" && (
                                      <span className="correct-pick">
                                        ✓ {userPick} - Correct! (+{game.points}{" "}
                                        pt{game.points > 1 ? "s" : ""})
                                      </span>
                                    )}
                                  {userPick &&
                                    game.winner &&
                                    pickStatus === "incorrect" && (
                                      <span className="incorrect-pick">
                                        ✗ {userPick} - Incorrect
                                      </span>
                                    )}
                                </div>

                                {game.winner && (
                                  <div className="tracker-winner">
                                    Winner: <strong>{game.winner}</strong>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  );
                })()}
          </>
        )}
      </div>
    </div>
  );
}
