import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import Leaderboard from "./components/Leaderboard";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";

import {
  REGULAR_SEASON_GAMES,
  getAllRegularSeasonGames,
  getAvailableWeeks,
} from "./data/regularSeasonGames";
import RegularSeasonPicks from "./components/RegularSeasonPicks";
import PlayoffPicks from "./components/PlayoffPicks";
import LiveTracker from "./components/LiveTracker";
import AdminPanel from "./components/AdminPanel";
import "./App.css";

// Toggle this flag to show/hide the site-wide under construction overlay
const UNDER_CONSTRUCTION = true;

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD0ANeqc2wuifzgXnZBIAMUqu3pJyyPV94",
  authDomain: "gridiron-guru-d1963.firebaseapp.com",
  projectId: "gridiron-guru-d1963",
  storageBucket: "gridiron-guru-d1963.firebasestorage.app",
  messagingSenderId: "485346155626",
  appId: "1:485346155626:web:214711fab381363b2afe13",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Full-screen overlay that sits in front of the entire app
function UnderConstructionOverlay() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "radial-gradient(circle at top, rgba(0,255,140,0.1), rgba(0,0,0,0.95))",
        color: "white",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "20px",
        fontFamily: "Bowlby One, system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "3rem", marginBottom: "1rem", letterSpacing: 2 }}>
        🏈 GRIDIRON GURU
      </h1>
      <h2 style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>
        SITE UNDER CONSTRUCTION
      </h2>
      <p style={{ fontSize: "1.1rem", maxWidth: "600px", lineHeight: 1.5 }}>
        We&apos;re tuning up the playbook and polishing the scoreboard.
        <br />
        Check back soon for the full NFL pick&apos;em experience.
      </p>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const [playoffGames, setPlayoffGames] = useState([]);
  const [regularSeasonGames, setRegularSeasonGames] =
    useState(REGULAR_SEASON_GAMES);

  const [userPicks, setUserPicks] = useState({});
  const [regularSeasonLeaderboard, setRegularSeasonLeaderboard] = useState([]);
  const [playoffLeaderboard, setPlayoffLeaderboard] = useState([]);

  const [activeTab, setActiveTab] = useState("regular-season");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // -----------------------------------------
  // AUTH STATE
  // -----------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setIsAdmin(userDoc.data().isAdmin || false);
          } else {
            setIsAdmin(false);
          }
        } catch (err) {
          console.error("Error loading user doc:", err);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  console.log("Admin status:", isAdmin);

  // -----------------------------------------
  // LOAD PLAYOFF GAMES
  // -----------------------------------------
  useEffect(() => {
    const loadPlayoffGames = async () => {
      try {
        const gamesDoc = await getDoc(doc(db, "config", "playoff-games"));
        if (gamesDoc.exists()) {
          setPlayoffGames(gamesDoc.data().games);
        }
      } catch (err) {
        console.error("Error loading playoff games:", err);
      }
    };

    loadPlayoffGames();

    const unsubscribe = onSnapshot(
      doc(db, "config", "playoff-games"),
      (docSnap) => {
        if (docSnap.exists()) {
          setPlayoffGames(docSnap.data().games);
        }
      }
    );

    return unsubscribe;
  }, []);

  // -----------------------------------------
  // LOAD REGULAR SEASON GAMES
  // -----------------------------------------
  useEffect(() => {
    const loadRegularSeasonGames = async () => {
      try {
        const gamesDoc = await getDoc(
          doc(db, "config", "regular-season-games")
        );
        if (gamesDoc.exists()) {
          setRegularSeasonGames(gamesDoc.data().games);
        }
      } catch (err) {
        console.error("Error loading regular season games:", err);
      }
    };

    loadRegularSeasonGames();

    const unsubscribe = onSnapshot(
      doc(db, "config", "regular-season-games"),
      (docSnap) => {
        if (docSnap.exists()) {
          setRegularSeasonGames(docSnap.data().games);
        }
      }
    );

    return unsubscribe;
  }, []);

  // -----------------------------------------
  // LOAD USER PICKS
  // -----------------------------------------
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, "picks", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserPicks(docSnap.data().picks || {});
      }
    });

    return unsubscribe;
  }, [user]);

  // -----------------------------------------
  // LEADERBOARD CALCULATIONS
  // -----------------------------------------
  useEffect(() => {
    const loadLeaderboards = async () => {
      try {
        const picksSnapshot = await getDocs(collection(db, "picks"));
        const usersSnapshot = await getDocs(collection(db, "users"));

        const userMap = {};
        usersSnapshot.forEach((docSnap) => {
          userMap[docSnap.id] = docSnap.data().displayName || "Anonymous";
        });

        const regularScores = [];
        const playoffScores = [];

        const allRegularGames = getAllRegularSeasonGames();

        picksSnapshot.forEach((docSnap) => {
          const picks = docSnap.data().picks || {};
          let regularScore = 0;
          let playoffScore = 0;

          // regular season
          allRegularGames.forEach((game) => {
            if (game.winner && picks[game.id] === game.winner) {
              regularScore += game.points;
            }
          });

          // playoffs
          playoffGames.forEach((game) => {
            if (game.winner && picks[game.id] === game.winner) {
              playoffScore += game.points;
            }
          });

          regularScores.push({
            uid: docSnap.id,
            name: userMap[docSnap.id],
            score: regularScore,
          });

          playoffScores.push({
            uid: docSnap.id,
            name: userMap[docSnap.id],
            score: playoffScore,
          });
        });

        regularScores.sort((a, b) => b.score - a.score);
        playoffScores.sort((a, b) => b.score - a.score);

        setRegularSeasonLeaderboard(regularScores);
        setPlayoffLeaderboard(playoffScores);
      } catch (err) {
        console.error("Error loading leaderboard:", err);
      }
    };

    if (playoffGames.length > 0) {
      loadLeaderboards();
      const interval = setInterval(loadLeaderboards, 10000);
      return () => clearInterval(interval);
    }
  }, [playoffGames, regularSeasonGames]);

  // -----------------------------------------
  // AUTH HANDLER
  // -----------------------------------------
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Prevent overwriting admin
        await setDoc(
          doc(db, "users", userCredential.user.uid),
          {
            displayName,
            email,
          },
          { merge: true }
        );

        await setDoc(
          doc(db, "picks", userCredential.user.uid),
          { picks: {} },
          { merge: true }
        );
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      setEmail("");
      setPassword("");
      setDisplayName("");
    } catch (error) {
      alert(error.message);
    }
  };

  // -----------------------------------------
  // HANDLE PICKS
  // -----------------------------------------
  const handlePick = async (gameId, team) => {
    if (!user) return;

    const newPicks = { ...userPicks };
    if (newPicks[gameId] === team) {
      delete newPicks[gameId];
    } else {
      newPicks[gameId] = team;
    }

    try {
      await setDoc(
        doc(db, "picks", user.uid),
        { picks: newPicks },
        { merge: true }
      );
    } catch (err) {
      alert("Error saving pick");
    }
  };

  // -----------------------------------------
  // ADMIN GAME UPDATES
  // -----------------------------------------
  const handleUpdatePlayoffGame = async (gameId, field, value) => {
    if (!isAdmin) return;
    const updated = playoffGames.map((g) =>
      g.id === gameId ? { ...g, [field]: value } : g
    );

    await updateDoc(doc(db, "config", "playoff-games"), { games: updated });
  };

  const handleUpdateRegularSeasonGame = async (week, gameId, field, value) => {
    if (!isAdmin) return;

    const weekKey = `week${week}`;
    const updatedGames = { ...regularSeasonGames };

    updatedGames[weekKey] = updatedGames[weekKey].map((g) =>
      g.id === gameId ? { ...g, [field]: value } : g
    );

    await updateDoc(doc(db, "config", "regular-season-games"), {
      games: updatedGames,
    });
  };

  // -----------------------------------------
  // RENDER
  // -----------------------------------------
  if (loading) {
    return (
      <>
        <div className="loading-screen">
          <div className="loading-spinner"></div>
        </div>
        {UNDER_CONSTRUCTION && <UnderConstructionOverlay />}
      </>
    );
  }

  if (!user) {
    return (
      <>
        <div className="auth-container">
          <div className="auth-card">
            <h1 className="auth-title">NFL PICK&apos;EM</h1>
            <div className="auth-subtitle">
              Make your picks. Win bragging rights.
            </div>

            <form onSubmit={handleAuth} className="auth-form">
              {isSignUp && (
                <input
                  type="text"
                  placeholder="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="auth-input"
                />
              )}

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input"
              />

              <button type="submit" className="auth-button">
                {isSignUp ? "SIGN UP" : "SIGN IN"}
              </button>
            </form>

            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="auth-toggle"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Need an account? Sign up"}
            </button>
          </div>
        </div>
        {UNDER_CONSTRUCTION && <UnderConstructionOverlay />}
      </>
    );
  }

  const regularScore =
    regularSeasonLeaderboard.find((l) => l.uid === user.uid)?.score || 0;
  const playoffScore =
    playoffLeaderboard.find((l) => l.uid === user.uid)?.score || 0;
  const totalScore = regularScore + playoffScore;

  return (
    <>
      <div className="app">
        <header className="header">
          <div className="header-content">
            <h1 className="header-title">PICK&apos;EM</h1>

            <div className="header-scores">
              <div className="header-score">
                <div className="score-value">{totalScore}</div>
                <div className="score-label">TOTAL</div>
              </div>
              <div className="score-breakdown">
                <div className="score-detail">REG: {regularScore}</div>
                <div className="score-detail">PO: {playoffScore}</div>
              </div>
            </div>
          </div>
        </header>

        <nav className="nav-tabs">
          <button
            className={`nav-tab ${
              activeTab === "regular-season" ? "active" : ""
            }`}
            onClick={() => setActiveTab("regular-season")}
          >
            PICKS
          </button>

          <button
            className={`nav-tab ${activeTab === "leaderboard" ? "active" : ""}`}
            onClick={() => setActiveTab("leaderboard")}
          >
            LEADERBOARD
          </button>

          <button
            className={`nav-tab ${activeTab === "tracker" ? "active" : ""}`}
            onClick={() => setActiveTab("tracker")}
          >
            LIVE TRACKER
          </button>

          <button
            className={`nav-tab ${activeTab === "standings" ? "active" : ""}`}
            onClick={() => setActiveTab("standings")}
          >
            STANDINGS
          </button>

          {isAdmin && (
            <button
              className={`nav-tab ${activeTab === "admin" ? "active" : ""}`}
              onClick={() => setActiveTab("admin")}
            >
              ADMIN
            </button>
          )}
        </nav>

        <main className="main-content">
          {activeTab === "regular-season" && (
            <RegularSeasonPicks
              regularSeasonGames={regularSeasonGames}
              userPicks={userPicks}
              handlePick={handlePick}
              availableWeeks={getAvailableWeeks()}
            />
          )}

          {activeTab === "playoffs-pick" && (
            <PlayoffPicks
              games={playoffGames}
              userPicks={userPicks}
              handlePick={handlePick}
            />
          )}

          {activeTab === "leaderboard" && (
            <Leaderboard
              db={db}
              currentUser={user}
              regularSeasonGames={regularSeasonGames}
            />
          )}

          {activeTab === "tracker" && (
            <LiveTracker
              regularSeasonGames={regularSeasonGames}
              playoffGames={playoffGames}
              userPicks={userPicks}
              availableWeeks={getAvailableWeeks()}
              user={user}
            />
          )}

          {activeTab === "standings" && (
            <section className="leaderboard-container">
              <h2 className="leaderboard-title">Standings</h2>

              <div className="leaderboard-list">
                {regularSeasonLeaderboard.map((entry, index) => {
                  const isCurrentUser = entry.uid === user.uid;
                  const playoffEntry = playoffLeaderboard.find(
                    (p) => p.uid === entry.uid
                  );
                  const poScore = playoffEntry?.score || 0;
                  const total = entry.score + poScore;

                  return (
                    <div
                      key={entry.uid}
                      className={
                        "leaderboard-entry" +
                        (isCurrentUser ? " current-user" : "")
                      }
                    >
                      <div className="leaderboard-rank">#{index + 1}</div>
                      <div className="leaderboard-name">{entry.name}</div>
                      <div className="leaderboard-score">{total}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {activeTab === "admin" && isAdmin && (
            <AdminPanel
              playoffGames={playoffGames}
              regularSeasonGames={regularSeasonGames}
              availableWeeks={getAvailableWeeks()}
              handleUpdatePlayoffGame={handleUpdatePlayoffGame}
              handleUpdateRegularSeasonGame={handleUpdateRegularSeasonGame}
            />
          )}

          <button onClick={() => signOut(auth)} className="sign-out-button">
            SIGN OUT
          </button>
        </main>
      </div>

      {UNDER_CONSTRUCTION && <UnderConstructionOverlay />}
    </>
  );
}

export default App;
