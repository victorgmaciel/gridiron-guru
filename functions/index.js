const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Fetches live NFL scores from ESPN every minute and updates Firestore.
 * No API key required. Very stable endpoint.
 *
 * This function:
 * - Updates awayScore/homeScore
 * - Updates status (Q3 05:12, FINAL, HALFTIME, etc)
 * - Sets winner when the game is final
 * - Works for ANY Firestore structure like:
 *   games: { week1: [...], week2: [...], week3: [...] }
 *
 * REQUIREMENT:
 * Each game must have:
 *    espnId: "<ESPN_EVENT_ID>"
 */
exports.updateNflScoresFromEspn = functions.pubsub
  .schedule("every 1 minutes")
  .timeZone("America/Los_Angeles")
  .onRun(async () => {
    console.log("🏈 Starting ESPN NFL score update...");

    try {
      // -------------------------------
      // 1) FETCH ESPN SCOREBOARD
      // -------------------------------
      const url =
        "https://site.web.api.espn.com/apis/v2/sports/football/nfl/scoreboard";

      const response = await fetch(url);
      if (!response.ok) {
        const text = await response.text();
        console.error("❌ ESPN API error:", response.status, text);
        return null;
      }

      const json = await response.json();
      const events = json?.events || [];

      if (!events.length) {
        console.log("⚠️ ESPN returned no events.");
        return null;
      }

      // Map for quick lookup
      const espnMap = {};
      for (const ev of events) {
        if (!ev?.id) continue;
        espnMap[ev.id] = ev;
      }

      console.log(`📡 Retrieved ${Object.keys(espnMap).length} ESPN games.`);

      // -------------------------------
      // 2) LOAD FIRESTORE GAME CONFIG
      // -------------------------------
      const configRef = db.collection("config").doc("regular-season-games");
      const snap = await configRef.get();

      if (!snap.exists) {
        console.error("❌ Firestore config/regular-season-games missing");
        return null;
      }

      const data = snap.data();
      const allWeeks = data.games || {};

      const updated = { ...allWeeks };

      // -------------------------------
      // 3) PROCESS EACH GAME
      // -------------------------------
      for (const [weekKey, weekGames] of Object.entries(allWeeks)) {
        updated[weekKey] = weekGames.map((game) => {
          if (!game.espnId) return game; // Skip games without ESPN mapping

          const ev = espnMap[game.espnId];
          if (!ev) {
            console.log(
              `⚠️ No ESPN match for game ID: ${game.espnId} (${game.awayTeam} @ ${game.homeTeam})`
            );
            return game;
          }

          const comp = ev.competitions?.[0];
          if (!comp) return game;

          const competitors = comp.competitors || [];

          const away = competitors.find((c) => c.homeAway === "away");
          const home = competitors.find((c) => c.homeAway === "home");

          const awayScore = away?.score ? Number(away.score) : null;
          const homeScore = home?.score ? Number(home.score) : null;

          // ESPN status meta
          const st = comp.status?.type || {};
          const state = st.state || ""; // "pre", "in", "post"
          const detail = st.detail || "";
          const shortDetail = st.shortDetail || "";
          const statusText = detail || shortDetail || state || "Unknown";

          // Determine winner ONLY when final
          let winner = game.winner || null;
          const isFinal = state === "post";

          if (
            isFinal &&
            awayScore !== null &&
            homeScore !== null &&
            awayScore !== homeScore
          ) {
            winner = awayScore > homeScore ? game.awayTeam : game.homeTeam;
          }

          return {
            ...game,
            awayScore,
            homeScore,
            status: statusText,
            ...(winner ? { winner } : {}),
          };
        });
      }

      // -------------------------------
      // 4) WRITE BACK TO FIRESTORE
      // -------------------------------
      await configRef.update({ games: updated });

      console.log("✅ NFL scores updated from ESPN.");
      return null;
    } catch (err) {
      console.error("❌ Error in updateNflScoresFromEspn:", err);
      return null;
    }
  });
