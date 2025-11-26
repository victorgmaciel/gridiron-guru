import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
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
import { INITIAL_GAMES } from "./data/games";
import {
  REGULAR_SEASON_GAMES,
  getAllRegularSeasonGames,
  getAvailableWeeks,
} from "./data/regularSeasonGames";
import RegularSeasonPicks from "./components/RegularSeasonPicks";
import PlayoffPicks from "./components/PlayoffPicks";
import Leaderboard from "./components/Leaderboard";
import LiveTracker from "./components/LiveTracker";
import AdminPanel from "./components/AdminPanel";
import "./App.css";

// Firebase configuration - REPLACE WITH YOUR CONFIG
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  // Games state
  const [playoffGames, setPlayoffGames] = useState([]);
  const [regularSeasonGames, setRegularSeasonGames] =
    useState(REGULAR_SEASON_GAMES);

  // User picks
  const [userPicks, setUserPicks] = useState({});

  // Leaderboards
  const [regularSeasonLeaderboard, setRegularSeasonLeaderboard] = useState([]);
  const [playoffLeaderboard, setPlayoffLeaderboard] = useState([]);

  // UI state
  const [activeTab, setActiveTab] = useState("regular-season");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setIsAdmin(userDoc.data().isAdmin || false);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Load playoff games
  useEffect(() => {
    const loadPlayoffGames = async () => {
      const gamesDoc = await getDoc(doc(db, "config", "playoff-games"));
      if (gamesDoc.exists()) {
        setPlayoffGames(gamesDoc.data().games);
      } else {
        await setDoc(doc(db, "config", "playoff-games"), {
          games: INITIAL_GAMES,
        });
        setPlayoffGames(INITIAL_GAMES);
      }
    };
    loadPlayoffGames();

    const unsubscribe = onSnapshot(
      doc(db, "config", "playoff-games"),
      (doc) => {
        if (doc.exists()) {
          setPlayoffGames(doc.data().games);
        }
      }
    );
    return unsubscribe;
  }, []);

  // Load regular season games
  useEffect(() => {
    const loadRegularSeasonGames = async () => {
      const gamesDoc = await getDoc(doc(db, "config", "regular-season-games"));
      if (gamesDoc.exists()) {
        setRegularSeasonGames(gamesDoc.data().games);
      } else {
        await setDoc(doc(db, "config", "regular-season-games"), {
          games: REGULAR_SEASON_GAMES,
        });
      }
    };
    loadRegularSeasonGames();

    const unsubscribe = onSnapshot(
      doc(db, "config", "regular-season-games"),
      (doc) => {
        if (doc.exists()) {
          setRegularSeasonGames(doc.data().games);
        }
      }
    );
    return unsubscribe;
  }, []);

  // Load user picks
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, "picks", user.uid), (doc) => {
      if (doc.exists()) {
        setUserPicks(doc.data().picks || {});
      }
    });
    return unsubscribe;
  }, [user]);

  // Calculate leaderboards
  useEffect(() => {
    const loadLeaderboards = async () => {
      const picksSnapshot = await getDocs(collection(db, "picks"));
      const usersSnapshot = await getDocs(collection(db, "users"));

      const userMap = {};
      usersSnapshot.forEach((doc) => {
        userMap[doc.id] = doc.data().displayName || "Anonymous";
      });

      const regularScores = [];
      const playoffScores = [];

      picksSnapshot.forEach((doc) => {
        const picks = doc.data().picks || {};
        let regularScore = 0;
        let playoffScore = 0;

        // Calculate regular season score
        const allRegularGames = getAllRegularSeasonGames();
        allRegularGames.forEach((game) => {
          if (game.winner && picks[game.id] === game.winner) {
            regularScore += game.points;
          }
        });

        // Calculate playoff score
        playoffGames.forEach((game) => {
          if (game.winner && picks[game.id] === game.winner) {
            playoffScore += game.points;
          }
        });

        regularScores.push({
          uid: doc.id,
          name: userMap[doc.id] || "Anonymous",
          score: regularScore,
        });

        playoffScores.push({
          uid: doc.id,
          name: userMap[doc.id] || "Anonymous",
          score: playoffScore,
        });
      });

      regularScores.sort((a, b) => b.score - a.score);
      playoffScores.sort((a, b) => b.score - a.score);

      setRegularSeasonLeaderboard(regularScores);
      setPlayoffLeaderboard(playoffScores);
    };

    if (playoffGames.length > 0) {
      loadLeaderboards();
      const interval = setInterval(loadLeaderboards, 10000);
      return () => clearInterval(interval);
    }
  }, [playoffGames, regularSeasonGames]);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await setDoc(doc(db, "users", userCredential.user.uid), {
          displayName: displayName,
          email: email,
          isAdmin: false,
        });
        await setDoc(doc(db, "picks", userCredential.user.uid), { picks: {} });
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

  const handlePick = async (gameId, team) => {
    if (!user) return;

    const newPicks = { ...userPicks };
    if (newPicks[gameId] === team) {
      delete newPicks[gameId];
    } else {
      newPicks[gameId] = team;
    }

    await updateDoc(doc(db, "picks", user.uid), { picks: newPicks });
  };

  const handleUpdatePlayoffGame = async (gameId, field, value) => {
    if (!isAdmin) return;

    const updatedGames = playoffGames.map((g) =>
      g.id === gameId ? { ...g, [field]: value } : g
    );
    await updateDoc(doc(db, "config", "playoff-games"), {
      games: updatedGames,
    });
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

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">NFL PICK'EM</h1>
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
    );
  }

  const regularScore =
    regularSeasonLeaderboard.find((l) => l.uid === user.uid)?.score || 0;
  const playoffScore =
    playoffLeaderboard.find((l) => l.uid === user.uid)?.score || 0;
  const totalScore = regularScore + playoffScore;

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="header-title">PICK'EM</h1>
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
          <Leaderboard
            regularSeasonLeaderboard={regularSeasonLeaderboard}
            playoffLeaderboard={playoffLeaderboard}
            user={user}
          />
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
      </main>

      <button onClick={() => signOut(auth)} className="sign-out-button">
        SIGN OUT
      </button>
    </div>
  );
}

export default App;
