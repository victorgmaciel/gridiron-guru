import { isOffSeason, NFL_SEASON } from "../data/regularSeasonGames";

const ROUND_ORDER = ["Wild Card", "Divisional", "Conference Championship", "Super Bowl"];

function OffSeasonScreen() {
  const formatted = NFL_SEASON.regularSeasonStart.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  return (
    <div className="offseason-screen">
      <div className="offseason-ball">🏆</div>
      <h2 className="offseason-title">Playoffs</h2>
      <p className="offseason-subtitle">
        The {NFL_SEASON.year} NFL Playoffs begin in January {NFL_SEASON.year + 1}.
      </p>
      <p className="offseason-hint">
        Make your regular season picks first — playoff matchups are set after Week 18.
      </p>
    </div>
  );
}

export default function PlayoffPicks({ games, userPicks, handlePick }) {
  // Show off-season screen if there are no games loaded
  if (!games || games.length === 0) {
    if (isOffSeason()) return <OffSeasonScreen />;
    return (
      <div className="empty-state">
        Playoff matchups haven't been set yet. Check back after Week 18.
      </div>
    );
  }

  // Group by round, sorted in bracket order
  const grouped = games.reduce((acc, game) => {
    if (!acc[game.round]) acc[game.round] = [];
    acc[game.round].push(game);
    return acc;
  }, {});

  const rounds = [
    ...ROUND_ORDER.filter((r) => grouped[r]),
    ...Object.keys(grouped).filter((r) => !ROUND_ORDER.includes(r)),
  ];

  return (
    <div className="picks-container">
      {rounds.map((round) => {
        const roundGames = grouped[round];
        return (
          <div key={round} className="day-section">
            <h3 className="day-title">{round}</h3>

            {roundGames.map((game) => {
              const isLive =
                (game.awayScore !== null || game.homeScore !== null) &&
                !game.winner;
              const isFinished = !!game.winner;
              const isLocked = isLive || isFinished;

              const cardClass = [
                "game-card",
                isLive ? "game-card--live" : "",
                isFinished ? "game-card--finished" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div key={game.id} className={cardClass}>
                  {/* Header */}
                  <div className="game-header-top">
                    <span className="game-matchup">
                      {game.away && game.home
                        ? `${game.away} @ ${game.home}`
                        : game.matchup || "TBD"}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="playoff-points">
                        {game.points} PT{game.points > 1 ? "S" : ""}
                      </span>
                      {isLive && (
                        <span className="status-badge status-live">LIVE</span>
                      )}
                      {isFinished && (
                        <span className="status-badge status-final">FINAL</span>
                      )}
                    </div>
                  </div>

                  {/* Score row */}
                  {(isLive || isFinished) &&
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
                      if (!team || team === "TBD")
                        return (
                          <button key={team || "tbd"} className="team-button" disabled>
                            <span className="team-name tbd-team">TBD</span>
                          </button>
                        );

                      const isSelected = userPicks[game.id] === team;
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
                          onClick={() => !isLocked && handlePick(game.id, team)}
                          disabled={isLocked}
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
    </div>
  );
}
