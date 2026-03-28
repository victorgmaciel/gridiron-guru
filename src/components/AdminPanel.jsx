import { useState } from "react";
import { getFirestore, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";
import { NFL_SEASON } from "../data/regularSeasonGames";

const db = getFirestore(getApp());
const functions = getFunctions(getApp());

export default function AdminPanel({
  playoffGames,
  regularSeasonGames,
  availableWeeks,
  handleUpdatePlayoffGame,
  handleUpdateRegularSeasonGame,
}) {
  const [adminView, setAdminView] = useState("fetch");
  const [selectedWeek, setSelectedWeek] = useState(availableWeeks[0] || 13);

  // ESPN fetch state
  const [fetchWeek, setFetchWeek] = useState(1);
  const [fetchYear, setFetchYear] = useState(NFL_SEASON.year);
  const [fetchType, setFetchType] = useState("2"); // 2=regular, 3=playoffs
  const [fetchStatus, setFetchStatus] = useState(null); // null | "loading" | {added, total} | "error"

  const currentWeekGames = regularSeasonGames[`week${selectedWeek}`] || [];

  const handleFetchSchedule = async () => {
    setFetchStatus("loading");
    try {
      const fetchNflSchedule = httpsCallable(functions, "fetchNflSchedule");
      const result = await fetchNflSchedule({
        week: fetchWeek,
        year: fetchYear,
        seasontype: parseInt(fetchType),
      });
      setFetchStatus(result.data);
    } catch (err) {
      console.error("Fetch schedule error:", err);
      setFetchStatus("error");
    }
  };

  const handleUploadLocalSchedule = async () => {
    try {
      const { REGULAR_SEASON_GAMES } = await import("../data/regularSeasonGames");
      await setDoc(doc(db, "config", "regular-season-games"), {
        games: REGULAR_SEASON_GAMES,
      });
      alert("Local schedule uploaded to Firestore!");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload local schedule.");
    }
  };

  return (
    <div className="admin-container">
      <h2 className="admin-title">⚙️ Admin Panel</h2>

      {/* View Toggle */}
      <div className="tracker-toggle" style={{ marginBottom: 20 }}>
        <button
          className={`toggle-button ${adminView === "fetch" ? "active" : ""}`}
          onClick={() => setAdminView("fetch")}
        >
          FETCH SCHEDULE
        </button>
        <button
          className={`toggle-button ${adminView === "regular" ? "active" : ""}`}
          onClick={() => setAdminView("regular")}
        >
          REG SEASON
        </button>
        <button
          className={`toggle-button ${adminView === "playoff" ? "active" : ""}`}
          onClick={() => setAdminView("playoff")}
        >
          PLAYOFFS
        </button>
      </div>

      {/* ── FETCH SCHEDULE FROM ESPN ── */}
      {adminView === "fetch" && (
        <div className="admin-fetch-section">
          <h3 className="admin-section-title">Fetch Schedule from ESPN</h3>
          <p className="admin-hint">
            Pulls the week's games directly from ESPN and saves them to Firestore.
            Run this once per week when the schedule is released.
          </p>

          <div className="admin-fetch-row">
            <div className="admin-field">
              <label className="admin-label">Season Type</label>
              <select
                value={fetchType}
                onChange={(e) => setFetchType(e.target.value)}
                className="admin-select"
              >
                <option value="2">Regular Season</option>
                <option value="3">Playoffs</option>
              </select>
            </div>

            <div className="admin-field">
              <label className="admin-label">Year</label>
              <input
                type="number"
                value={fetchYear}
                onChange={(e) => setFetchYear(parseInt(e.target.value))}
                className="admin-input-small"
                min="2024"
                max="2030"
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">
                {fetchType === "3" ? "Round (1=WC, 2=Div, 3=Conf, 4=SB)" : "Week"}
              </label>
              <input
                type="number"
                value={fetchWeek}
                onChange={(e) => setFetchWeek(parseInt(e.target.value))}
                className="admin-input-small"
                min="1"
                max="22"
              />
            </div>
          </div>

          <button
            className="admin-btn admin-btn-primary"
            onClick={handleFetchSchedule}
            disabled={fetchStatus === "loading"}
          >
            {fetchStatus === "loading" ? "Fetching…" : "📡 Fetch from ESPN"}
          </button>

          {fetchStatus && fetchStatus !== "loading" && fetchStatus !== "error" && (
            <div className="admin-result admin-result-success">
              ✅ Done — {fetchStatus.added} new game{fetchStatus.added !== 1 ? "s" : ""} added
              {fetchStatus.total ? ` (${fetchStatus.total} total this week)` : ""}
            </div>
          )}
          {fetchStatus === "error" && (
            <div className="admin-result admin-result-error">
              ❌ Failed to fetch schedule. Check console for details.
            </div>
          )}

          <div className="admin-divider" />

          <h3 className="admin-section-title">Upload Local Schedule</h3>
          <p className="admin-hint">
            Pushes the hardcoded games from <code>regularSeasonGames.js</code> to Firestore.
            Use this to seed the database before the season or reset to defaults.
          </p>
          <button
            className="admin-btn admin-btn-secondary"
            onClick={handleUploadLocalSchedule}
          >
            📤 Upload Local Schedule to Firestore
          </button>
        </div>
      )}

      {/* ── REGULAR SEASON EDITOR ── */}
      {adminView === "regular" && (
        <>
          <div className="week-selector" style={{ marginBottom: 16 }}>
            <label className="week-label">Week</label>
            <select
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

          {currentWeekGames.length === 0 && (
            <div className="empty-state">
              No games for week {selectedWeek} yet. Use Fetch Schedule to populate.
            </div>
          )}

          {currentWeekGames.map((game) => (
            <div key={game.id} className="admin-game-card">
              <div className="admin-game-header">
                {game.away} @ {game.home}
                <span className="admin-game-meta">
                  {game.day} · {game.time}
                </span>
              </div>

              <div className="admin-inputs">
                <div className="admin-score-row">
                  <div className="admin-score-input">
                    <label className="admin-label">{game.away} Score</label>
                    <input
                      type="number"
                      value={game.awayScore ?? ""}
                      onChange={(e) =>
                        handleUpdateRegularSeasonGame(
                          selectedWeek,
                          game.id,
                          "awayScore",
                          e.target.value !== "" ? parseInt(e.target.value) : null
                        )
                      }
                      className="admin-input-small"
                      placeholder="—"
                    />
                  </div>

                  <div className="admin-score-input">
                    <label className="admin-label">{game.home} Score</label>
                    <input
                      type="number"
                      value={game.homeScore ?? ""}
                      onChange={(e) =>
                        handleUpdateRegularSeasonGame(
                          selectedWeek,
                          game.id,
                          "homeScore",
                          e.target.value !== "" ? parseInt(e.target.value) : null
                        )
                      }
                      className="admin-input-small"
                      placeholder="—"
                    />
                  </div>
                </div>

                <div className="admin-input-row">
                  <label className="admin-label">Winner</label>
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
                    <option value="">No winner yet</option>
                    <option value={game.away}>{game.away}</option>
                    <option value={game.home}>{game.home}</option>
                  </select>
                </div>

                {game.winner && (
                  <div className="admin-status">
                    ✓ {game.winner} wins
                    {game.awayScore !== null && game.homeScore !== null
                      ? ` · ${game.awayScore}-${game.homeScore}`
                      : ""}
                  </div>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── PLAYOFF EDITOR ── */}
      {adminView === "playoff" && (
        <>
          {(!playoffGames || playoffGames.length === 0) && (
            <div className="empty-state">
              No playoff games yet. Use Fetch Schedule (type = Playoffs) to populate.
            </div>
          )}

          {playoffGames?.map((game) => (
            <div key={game.id} className="admin-game-card">
              <div className="admin-game-header">
                {game.matchup || `${game.away} @ ${game.home}`}
                <span className="admin-game-meta">{game.round}</span>
              </div>

              <div className="admin-inputs">
                <div className="admin-score-row">
                  <div className="admin-score-input">
                    <label className="admin-label">{game.away || "Away"} Score</label>
                    <input
                      type="number"
                      value={game.awayScore ?? ""}
                      onChange={(e) =>
                        handleUpdatePlayoffGame(
                          game.id,
                          "awayScore",
                          e.target.value !== "" ? parseInt(e.target.value) : null
                        )
                      }
                      className="admin-input-small"
                      placeholder="—"
                    />
                  </div>

                  <div className="admin-score-input">
                    <label className="admin-label">{game.home || "Home"} Score</label>
                    <input
                      type="number"
                      value={game.homeScore ?? ""}
                      onChange={(e) =>
                        handleUpdatePlayoffGame(
                          game.id,
                          "homeScore",
                          e.target.value !== "" ? parseInt(e.target.value) : null
                        )
                      }
                      className="admin-input-small"
                      placeholder="—"
                    />
                  </div>
                </div>

                <div className="admin-input-row">
                  <label className="admin-label">Winner</label>
                  <select
                    value={game.winner || ""}
                    onChange={(e) =>
                      handleUpdatePlayoffGame(game.id, "winner", e.target.value || null)
                    }
                    className="admin-select"
                  >
                    <option value="">No winner yet</option>
                    {game.away && <option value={game.away}>{game.away}</option>}
                    {game.home && <option value={game.home}>{game.home}</option>}
                  </select>
                </div>

                {game.winner && (
                  <div className="admin-status">
                    ✓ {game.winner} wins
                    {game.awayScore !== null && game.homeScore !== null
                      ? ` · ${game.awayScore}-${game.homeScore}`
                      : ""}
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
