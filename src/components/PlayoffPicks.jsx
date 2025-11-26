export default function PlayoffPicks({ games, userPicks, handlePick }) {
  const groupedGames = games.reduce((acc, game) => {
    if (!acc[game.round]) acc[game.round] = [];
    acc[game.round].push(game);
    return acc;
  }, {});

  return (
    <div className="picks-container">
      {Object.entries(groupedGames).map(([round, roundGames]) => (
        <div key={round} className="round-section">
          <h2 className="round-title">{round}</h2>
          {roundGames.map((game) => (
            <div key={game.id} className="game-card">
              <div className="game-header">
                <span className="game-matchup">{game.matchup}</span>
                <span className="game-points">
                  {game.points} PT{game.points > 1 ? "S" : ""}
                </span>
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
                  onClick={() => handlePick(game.id, game.away)}
                  disabled={game.winner !== null}
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
                  onClick={() => handlePick(game.id, game.home)}
                  disabled={game.winner !== null}
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
      ))}
    </div>
  );
}
