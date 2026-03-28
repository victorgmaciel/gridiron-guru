const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// NFL 2025 season window: Sep 4, 2025 – Feb 9, 2026
const SEASON_START = new Date("2025-09-04T00:00:00Z");
const SEASON_END = new Date("2026-02-09T00:00:00Z");

const isOffSeason = () => {
  const now = new Date();
  return now < SEASON_START || now > SEASON_END;
};

/**
 * Fetches live NFL scores from ESPN every minute and updates Firestore.
 * Skips automatically during the off-season to conserve quota.
 */
exports.updateNflScoresFromEspn = functions.pubsub
  .schedule("every 1 minutes")
  .timeZone("America/Los_Angeles")
  .onRun(async () => {
    // Off-season guard — nothing to update outside the season window
    if (isOffSeason()) {
      console.log("⏸️  Off-season. Skipping score update.");
      return null;
    }

    console.log("🏈 Starting ESPN NFL score update...");

    try {
      // 1) Fetch ESPN scoreboard
      const url =
        "https://site.web.api.espn.com/apis/v2/sports/football/nfl/scoreboard";

      const response = await fetch(url);
      if (!response.ok) {
        console.error("❌ ESPN API error:", response.status);
        return null;
      }

      const json = await response.json();
      const events = json?.events || [];

      if (!events.length) {
        console.log("⚠️ ESPN returned no events.");
        return null;
      }

      // Build ESPN id → event map
      const espnMap = {};
      for (const ev of events) {
        if (ev?.id) espnMap[ev.id] = ev;
      }

      console.log(`📡 Retrieved ${Object.keys(espnMap).length} ESPN games.`);

      // 2) Load Firestore game config
      const configRef = db.collection("config").doc("regular-season-games");
      const snap = await configRef.get();

      if (!snap.exists) {
        console.error("❌ Firestore config/regular-season-games missing");
        return null;
      }

      const allWeeks = snap.data().games || {};
      const updated = { ...allWeeks };

      // 3) Update each game
      for (const [weekKey, weekGames] of Object.entries(allWeeks)) {
        updated[weekKey] = weekGames.map((game) => {
          if (!game.espnId) return game;

          const ev = espnMap[game.espnId];
          if (!ev) return game;

          const comp = ev.competitions?.[0];
          if (!comp) return game;

          const away = comp.competitors?.find((c) => c.homeAway === "away");
          const home = comp.competitors?.find((c) => c.homeAway === "home");

          const awayScore = away?.score != null ? Number(away.score) : null;
          const homeScore = home?.score != null ? Number(home.score) : null;

          const st = comp.status?.type || {};
          const state = st.state || "";
          const statusText = st.detail || st.shortDetail || state || "";

          let winner = game.winner || null;
          if (
            state === "post" &&
            awayScore !== null &&
            homeScore !== null &&
            awayScore !== homeScore
          ) {
            winner = awayScore > homeScore ? game.away : game.home;
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

      // 4) Write back
      await configRef.update({ games: updated });
      console.log("✅ NFL scores updated from ESPN.");
      return null;
    } catch (err) {
      console.error("❌ Error in updateNflScoresFromEspn:", err);
      return null;
    }
  });

/**
 * Callable function: fetch a week's schedule from ESPN and write to Firestore.
 *
 * Call from admin UI with: { week: 1, year: 2025 }
 *
 * Merges into existing Firestore doc (preserves espnId or other manual fields
 * for games already stored, adds new games from ESPN).
 */
exports.fetchNflSchedule = functions.https.onCall(async (data) => {
  const week = Number(data.week);
  const year = Number(data.year) || 2025;
  const seasontype = Number(data.seasontype) || 2; // 2 = regular season, 3 = playoffs

  if (!week || week < 1 || week > 22) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "week must be between 1 and 22"
    );
  }

  const url =
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard` +
    `?seasontype=${seasontype}&week=${week}&dates=${year}`;

  console.log(`📅 Fetching ESPN schedule: week ${week}, year ${year}, type ${seasontype}`);

  let events;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new functions.https.HttpsError(
        "unavailable",
        `ESPN returned ${res.status}`
      );
    }
    const json = await res.json();
    events = json?.events || [];
  } catch (err) {
    console.error("❌ ESPN fetch error:", err);
    throw new functions.https.HttpsError("unavailable", "Failed to reach ESPN API");
  }

  if (!events.length) {
    return { added: 0, message: "No games found for that week/year." };
  }

  // Map ESPN events → our game schema
  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const newGames = events.map((ev) => {
    const comp = ev.competitions?.[0] || {};
    const away = comp.competitors?.find((c) => c.homeAway === "away");
    const home = comp.competitors?.find((c) => c.homeAway === "home");

    const date = new Date(ev.date || comp.date);
    const dayName = DAY_NAMES[date.getDay()];
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
      timeZoneName: "short",
    });

    return {
      id: `w${week}-espn-${ev.id}`,
      week,
      day: dayName,
      time: timeStr,
      away: away?.team?.shortDisplayName || away?.team?.displayName || "Away",
      home: home?.team?.shortDisplayName || home?.team?.displayName || "Home",
      winner: null,
      awayScore: null,
      homeScore: null,
      status: "",
      points: 1,
      espnId: ev.id,
    };
  });

  // Write to Firestore — merge into existing week key
  const weekKey = `week${week}`;

  if (seasontype === 2) {
    // Regular season → config/regular-season-games
    const configRef = db.collection("config").doc("regular-season-games");
    const snap = await configRef.get();
    const existing = snap.exists ? snap.data().games || {} : {};

    // Keep manually-edited games (matched by espnId), add truly new ones
    const existingGames = existing[weekKey] || [];
    const existingEspnIds = new Set(existingGames.map((g) => g.espnId).filter(Boolean));

    const toAdd = newGames.filter((g) => !existingEspnIds.has(g.espnId));
    const merged = [...existingGames, ...toAdd];

    await configRef.set({ games: { ...existing, [weekKey]: merged } }, { merge: true });
    console.log(`✅ Added ${toAdd.length} games to regular season week ${week}`);
    return { added: toAdd.length, total: merged.length };
  } else {
    // Playoffs → config/playoff-games (flat array, grouped by round)
    const ROUND_MAP = {
      1: "Wild Card",
      2: "Divisional",
      3: "Conference Championship",
      4: "Super Bowl",
    };
    const round = ROUND_MAP[week] || `Playoff Round ${week}`;
    const playoffGames = newGames.map((g, i) => ({
      ...g,
      id: `playoff-w${week}-${i}`,
      round,
      matchup: `${g.away} @ ${g.home}`,
      points: week === 4 ? 5 : week === 3 ? 3 : week === 2 ? 2 : 1,
    }));

    const configRef = db.collection("config").doc("playoff-games");
    const snap = await configRef.get();
    const existing = snap.exists ? snap.data().games || [] : [];
    const existingEspnIds = new Set(existing.map((g) => g.espnId).filter(Boolean));
    const toAdd = playoffGames.filter((g) => !existingEspnIds.has(g.espnId));
    const merged = [...existing, ...toAdd];

    await configRef.set({ games: merged });
    console.log(`✅ Added ${toAdd.length} playoff games for round ${round}`);
    return { added: toAdd.length, total: merged.length };
  }
});
