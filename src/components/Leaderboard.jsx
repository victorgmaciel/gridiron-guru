import { useState } from "react";

export default function Leaderboard({
  regularSeasonLeaderboard,
  playoffLeaderboard,
  user,
}) {
  const [selectedBoard, setSelectedBoard] = useState("regular");

  const currentLeaderboard =
    selectedBoard === "regular" ? regularSeasonLeaderboard : playoffLeaderboard;

  return (
    <div className="leaderboard-container">
      {/* Toggle between Regular Season and Playoff standings */}
      <div className="leaderboard-toggle">
        <button
          className={`toggle-button ${
            selectedBoard === "regular" ? "active" : ""
          }`}
          onClick={() => setSelectedBoard("regular")}
        >
          REGULAR SEASON
        </button>
        <button
          className={`toggle-button ${
            selectedBoard === "playoff" ? "active" : ""
          }`}
          onClick={() => setSelectedBoard("playoff")}
        >
          PLAYOFFS
        </button>
      </div>

      <div className="leaderboard-title">
        {selectedBoard === "regular"
          ? "Regular Season Standings"
          : "Playoff Standings"}
      </div>

      <div className="leaderboard-list">
        {currentLeaderboard.map((entry, index) => (
          <div
            key={entry.uid}
            className={`leaderboard-entry ${
              entry.uid === user?.uid ? "current-user" : ""
            }`}
          >
            <div className="leaderboard-rank">#{index + 1}</div>
            <div className="leaderboard-name">{entry.name}</div>
            <div className="leaderboard-score">{entry.score}</div>
          </div>
        ))}
        {currentLeaderboard.length === 0 && (
          <div className="empty-state">No picks yet. Be the first!</div>
        )}
      </div>
    </div>
  );
}
