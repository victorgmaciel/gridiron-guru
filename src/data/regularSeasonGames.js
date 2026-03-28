// 2025 NFL Regular Season Games
// Week 13 onwards

export const REGULAR_SEASON_GAMES = {
  week13: [
    // Thursday - Thanksgiving
    {
      id: "w13-thurs-1",
      week: 13,
      day: "Thursday",
      time: "1:00 PM ET",
      away: "Packers",
      home: "Lions",
      winner: null,
      awayScore: null,
      homeScore: null,
      points: 1,
    },
    {
      id: "w13-thurs-2",
      week: 13,
      day: "Thursday",
      time: "4:30 PM ET",
      away: "Chiefs",
      home: "Cowboys",
      winner: null,
      awayScore: null,
      homeScore: null,
      points: 1,
    },
    {
      id: "w13-thurs-3",
      week: 13,
      day: "Thursday",
      time: "8:20 PM ET",
      away: "Bengals",
      home: "Ravens",
      winner: null,
      awayScore: null,
      homeScore: null,
      points: 1,
    },

    // Friday - Black Friday
    {
      id: "w13-fri-1",
      week: 13,
      day: "Friday",
      time: "3:00 PM ET",
      away: "Bears",
      home: "Eagles",
      winner: null,
      awayScore: null,
      homeScore: null,
      points: 1,
    },

    // Sunday Early Games
    {
      id: "w13-sun-1",
      week: 13,
      day: "Sunday",
      time: "1:00 PM ET",
      away: "49ers",
      home: "Browns",
      winner: null,
      awayScore: null,
      homeScore: null,
      points: 1,
    },
    {
      id: "w13-sun-2",
      week: 13,
      day: "Sunday",
      time: "1:00 PM ET",
      away: "Jaguars",
      home: "Titans",
      winner: null,
      awayScore: null,
      homeScore: null,
      points: 1,
    },
    {
      id: "w13-sun-3",
      week: 13,
      day: "Sunday",
      time: "1:00 PM ET",
      away: "Texans",
      home: "Colts",
      winner: null,
      awayScore: null,
      homeScore: null,
      points: 1,
    },
    {
      id: "w13-sun-4",
      week: 13,
      day: "Sunday",
      time: "1:00 PM ET",
      away: "Saints",
      home: "Dolphins",
      winner: null,
      awayScore: null,
      homeScore: null,
      points: 1,
    },
    {
      id: "w13-sun-5",
      week: 13,
      day: "Sunday",
      time: "1:00 PM ET",
      away: "Falcons",
      home: "Jets",
      winner: null,
      awayScore: null,
      homeScore: null,
      points: 1,
    },
    {
      id: "w13-sun-6",
      week: 13,
      day: "Sunday",
      time: "1:00 PM ET",
      away: "Cardinals",
      home: "Buccaneers",
      winner: null,
      awayScore: null,
      homeScore: null,
      points: 1,
    },

    // Sunday Late Games
    {
      id: "w13-sun-7",
      week: 13,
      day: "Sunday",
      time: "4:05 PM ET",
      away: "Seahawks",
      home: "Panthers",
      winner: null,
      awayScore: null,
      homeScore: null,
      points: 1,
    },
    {
      id: "w13-sun-8",
      week: 13,
      day: "Sunday",
      time: "4:25 PM ET",
      away: "Rams",
      home: "Giants",
      winner: null,
      awayScore: null,
      homeScore: null,
      points: 1,
    },
    {
      id: "w13-sun-9",
      week: 13,
      day: "Sunday",
      time: "4:25 PM ET",
      away: "Chargers",
      home: "Vikings",
      winner: null,
      awayScore: null,
      homeScore: null,
      points: 1,
    },

    // Sunday Night
    {
      id: "w13-sun-night",
      week: 13,
      day: "Sunday",
      time: "8:20 PM ET",
      away: "Steelers",
      home: "Bills",
      winner: null,
      awayScore: null,
      homeScore: null,
      points: 1,
    },

    // Monday Night
    {
      id: "w13-mon",
      week: 13,
      day: "Monday",
      time: "8:20 PM ET",
      away: "Broncos",
      home: "Commanders",
      winner: null,
      awayScore: null,
      homeScore: null,
      points: 1,
    },
  ],

  week14: [],
  week15: [],
  week16: [],
  week17: [],
  week18: [],
};

// Helper to get all regular season games as flat array
export const getAllRegularSeasonGames = () => {
  return Object.values(REGULAR_SEASON_GAMES).flat();
};

// Helper to get available weeks (from static fallback — Firestore overrides in App)
export const getAvailableWeeks = (gamesObj = REGULAR_SEASON_GAMES) => {
  return Object.keys(gamesObj)
    .filter((week) => Array.isArray(gamesObj[week]) && gamesObj[week].length > 0)
    .map((week) => parseInt(week.replace("week", "")))
    .sort((a, b) => a - b);
};

// -----------------------------------------------
// 2025 NFL Season Config
// Regular season: Sep 4, 2025 – Jan 4, 2026
// Playoffs end:   Feb 8, 2026 (Super Bowl LX)
// -----------------------------------------------
export const NFL_SEASON = {
  year: 2025,
  regularSeasonStart: new Date("2025-09-04T00:00:00"),
  regularSeasonEnd: new Date("2026-01-05T00:00:00"),
  playoffsEnd: new Date("2026-02-09T00:00:00"), // day after Super Bowl
};

/**
 * Returns the current NFL week number (1–18) during the regular season,
 * or null if we're outside it.
 */
export const getCurrentNflWeek = () => {
  const now = new Date();
  const { regularSeasonStart, regularSeasonEnd } = NFL_SEASON;
  if (now < regularSeasonStart || now >= regularSeasonEnd) return null;
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.min(Math.floor((now - regularSeasonStart) / msPerWeek) + 1, 18);
};

/**
 * Returns true when we're outside the full NFL season window (regular + playoffs).
 */
export const isOffSeason = () => {
  const now = new Date();
  return now < NFL_SEASON.regularSeasonStart || now >= NFL_SEASON.playoffsEnd;
};

/**
 * Best default week to show: current NFL week if in-season,
 * otherwise the last week that has games.
 */
export const getDefaultWeek = (availableWeeks) => {
  const current = getCurrentNflWeek();
  if (current && availableWeeks.includes(current)) return current;
  // Fallback: latest available week
  return availableWeeks.length > 0 ? availableWeeks[availableWeeks.length - 1] : 1;
};
