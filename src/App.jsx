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
  initializeFirestore,
  persistentLocalCache,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";

import { REGULAR_SEASON_GAMES, getAvailableWeeks } from "./data/regularSeasonGames";
import RegularSeasonPicks from "./components/RegularSeasonPicks";
import PlayoffPicks from "./components/PlayoffPicks";
import LiveTracker from "./components/LiveTracker";
import AdminPanel from "./components/AdminPanel";
import "./App.css";

// Firebase config — values come from .env.local (never committed to git)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, { localCache: persistentLocalCache() });

function App() {
  const [user, setUser] = useState(null);
  const [userDisplayName, setUserDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const [playoffGames, setPlayoffGames] = useState([]);
  const [regularSeasonGames, setRegularSeasonGames] = useState(REGULAR_SEASON_GAMES);

  const [userPicks, setUserPicks] = useState({});

  // "picks" sub-mode: "regular" | "playoffs"
  const [picksMode, setPicksMode] = useState("regular");
  const [activeTab, setActiveTab] = useState("picks");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // -----------------------------------------
  // AUTH STATE
  // -----------------------------------------
  useEffect(() => {
    let unsubUserDoc = null;

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      // Clean up previous user doc listener
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      if (currentUser) {
        // Use onSnapshot so it works offline (no getDoc one-shot fetch)
        unsubUserDoc = onSnapshot(
          doc(db, "users", currentUser.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setIsAdmin(data.isAdmin || false);
              setUserDisplayName(data.displayName || currentUser.email);
            } else {
              setIsAdmin(false);
              setUserDisplayName(currentUser.email);
            }
            setLoading(false);
          },
          () => {
            setIsAdmin(false);
            setUserDisplayName(currentUser.email);
            setLoading(false);
          }
        );
      } else {
        setIsAdmin(false);
        setUserDisplayName("");
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  // -----------------------------------------
  // LOAD PLAYOFF GAMES (real-time)
  // -----------------------------------------
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "config", "playoff-games"),
      (docSnap) => {
        if (docSnap.exists()) {
          setPlayoffGames(docSnap.data().games || []);
        }
      }
    );
    return unsubscribe;
  }, []);

  // -----------------------------------------
  // LOAD REGULAR SEASON GAMES (real-time)
  // -----------------------------------------
  useEffect(() => {
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
  // LOAD USER PICKS (real-time)
  // -----------------------------------------
  useEffect(() => {
    setUserPicks({});
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, "picks", user.uid), (docSnap) => {
      setUserPicks(docSnap.exists() ? (docSnap.data().picks || {}) : {});
    });

    return unsubscribe;
  }, [user]);

  // -----------------------------------------
  // LOCK LOGIC
  // A week is locked once any game in it has started.
  // -----------------------------------------
  const isWeekLocked = (weekNum) => {
    const games = regularSeasonGames[`week${weekNum}`] || [];
    return games.some(
      (game) =>
        game.winner !== null ||
        game.awayScore !== null ||
        (game.status && game.status.trim() !== "")
    );
  };

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

        await setDoc(
          doc(db, "users", userCredential.user.uid),
          { displayName, email },
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
      <div className="loading-screen">
        <div className="loading-brand">
          <div className="loading-logo">🏈</div>
          <div className="loading-title">GRIDIRON GURU</div>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">🏈</div>
          <h1 className="auth-title">GRIDIRON GURU</h1>
          <div className="auth-subtitle">Make your picks. Win bragging rights.</div>

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
              {isSignUp ? "CREATE ACCOUNT" : "SIGN IN"}
            </button>
          </form>

          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="auth-toggle"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </button>
        </div>
      </div>
    );
  }

  const availableWeeks = getAvailableWeeks(regularSeasonGames);

  return (
    <div className="app">
      {/* ---- HEADER ---- */}
      <header className="header">
        <div className="header-content">
          <h1 className="header-title">GRIDIRON GURU</h1>
          <div className="header-right">
            <span className="header-user">{userDisplayName}</span>
            <button onClick={() => signOut(auth)} className="sign-out-button">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ---- MAIN CONTENT ---- */}
      <main className="main-content" key={activeTab}>
        {activeTab === "picks" && (
          <>
            {/* Regular / Playoff sub-toggle */}
            <div className="picks-mode-toggle">
              <button
                className={`toggle-button ${picksMode === "regular" ? "active" : ""}`}
                onClick={() => setPicksMode("regular")}
              >
                REGULAR SEASON
              </button>
              <button
                className={`toggle-button ${picksMode === "playoffs" ? "active" : ""}`}
                onClick={() => setPicksMode("playoffs")}
              >
                PLAYOFFS
              </button>
            </div>

            {picksMode === "regular" && (
              <RegularSeasonPicks
                regularSeasonGames={regularSeasonGames}
                userPicks={userPicks}
                handlePick={handlePick}
                isWeekLocked={isWeekLocked}
              />
            )}

            {picksMode === "playoffs" && (
              <PlayoffPicks
                games={playoffGames}
                userPicks={userPicks}
                handlePick={handlePick}
              />
            )}
          </>
        )}

        {activeTab === "leaderboard" && (
          <Leaderboard
            db={db}
            currentUser={user}
            regularSeasonGames={regularSeasonGames}
          />
        )}

        {activeTab === "live" && (
          <LiveTracker
            regularSeasonGames={regularSeasonGames}
            playoffGames={playoffGames}
            userPicks={userPicks}
            availableWeeks={availableWeeks}
            user={user}
          />
        )}

        {activeTab === "admin" && isAdmin && (
          <AdminPanel
            playoffGames={playoffGames}
            regularSeasonGames={regularSeasonGames}
            availableWeeks={availableWeeks}
            handleUpdatePlayoffGame={handleUpdatePlayoffGame}
            handleUpdateRegularSeasonGame={handleUpdateRegularSeasonGame}
          />
        )}
      </main>

      {/* ---- BOTTOM NAV ---- */}
      <nav className="bottom-nav">
        <button
          className={`bottom-nav-item ${activeTab === "picks" ? "active" : ""}`}
          onClick={() => setActiveTab("picks")}
        >
          <span className="bottom-nav-icon">🏈</span>
          <span className="bottom-nav-label">Picks</span>
        </button>

        <button
          className={`bottom-nav-item ${activeTab === "leaderboard" ? "active" : ""}`}
          onClick={() => setActiveTab("leaderboard")}
        >
          <span className="bottom-nav-icon">🏆</span>
          <span className="bottom-nav-label">Standings</span>
        </button>

        <button
          className={`bottom-nav-item ${activeTab === "live" ? "active" : ""}`}
          onClick={() => setActiveTab("live")}
        >
          <span className="bottom-nav-icon">⚡</span>
          <span className="bottom-nav-label">Live</span>
        </button>

        {isAdmin && (
          <button
            className={`bottom-nav-item ${activeTab === "admin" ? "active" : ""}`}
            onClick={() => setActiveTab("admin")}
          >
            <span className="bottom-nav-icon">⚙️</span>
            <span className="bottom-nav-label">Admin</span>
          </button>
        )}
      </nav>
    </div>
  );
}

export default App;
