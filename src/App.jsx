import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
// import { ComparePicks } from "./components/ComparePicks";
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

// Firebase configuration
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

  // Load playoff games
  useEffect(() => {
    const loadPlayoffGames = async () => {
      try {
        const gamesDoc = await getDoc(doc(db, "config", "playoff-games"));

        if (gamesDoc.exists()) {
          setPlayoffGames(gamesDoc.data().games);
        } else {
          console.warn("config/playoff-games document is missing in Firestore");
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
      },
      (err) => {
        console.error("Error in playoff-games onSnapshot:", err);
      }
    );

    return unsubscribe;
  }, []);

  // Load regular season games
  useEffect(() => {
    const loadRegularSeasonGames = async () => {
      try {
        const gamesDoc = await getDoc(
          doc(db, "config", "regular-season-games")
        );

        if (gamesDoc.exists()) {
          setRegularSeasonGames(gamesDoc.data().games);
        } else {
          console.warn(
            "config/regular-season-games document is missing in Firestore"
          );
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
      },
      (err) => {
        console.error("Error in regular-season-games onSnapshot:", err);
      }
    );

    return unsubscribe;
  }, []);

  // Load user picks
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(
      doc(db, "picks", user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          setUserPicks(docSnap.data().picks || {});
        } else {
          setUserPicks({});
        }
      },
      (err) => {
        console.error("Error in user picks onSnapshot:", err);
      }
    );

    return unsubscribe;
  }, [user]);

  // Calculate leaderboards
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

          // Calculate regular season score
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
            uid: docSnap.id,
            name: userMap[docSnap.id] || "Anonymous",
            score: regularScore,
          });

          playoffScores.push({
            uid: docSnap.id,
            name: userMap[docSnap.id] || "Anonymous",
            score: playoffScore,
          });
        });

        regularScores.sort((a, b) => b.score - a.score);
        playoffScores.sort((a, b) => b.score - a.score);

        setRegularSeasonLeaderboard(regularScores);
        setPlayoffLeaderboard(playoffScores);
      } catch (err) {
        console.error("Error loading leaderboards:", err);
      }
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
      console.error("Auth error:", error);
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

    try {
      await setDoc(
        doc(db, "picks", user.uid),
        { picks: newPicks },
        { merge: true }
      );
    } catch (err) {
      console.error("Error updating picks:", err);
      alert("Could not save pick: " + err.message);
    }
  };

  const handleUpdatePlayoffGame = async (gameId, field, value) => {
    if (!isAdmin) return;

    const updatedGames = playoffGames.map((g) =>
      g.id === gameId ? { ...g, [field]: value } : g
    );

    try {
      await updateDoc(doc(db, "config", "playoff-games"), {
        games: updatedGames,
      });
    } catch (err) {
      console.error("Error updating playoff games:", err);
      alert("Could not update playoff games: " + err.message);
    }
  };

  const handleUpdateRegularSeasonGame = async (week, gameId, field, value) => {
    if (!isAdmin) return;

    const weekKey = `week${week}`;
    const updatedGames = { ...regularSeasonGames };

    updatedGames[weekKey] = updatedGames[weekKey].map((g) =>
      g.id === gameId ? { ...g, [field]: value } : g
    );

    try {
      await updateDoc(doc(db, "config", "regular-season-games"), {
        games: updatedGames,
      });
    } catch (err) {
      console.error("Error updating regular season games:", err);
      alert("Could not update regular season games: " + err.message);
    }
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
        <button
          className={`nav-tab ${activeTab === "compare" ? "active" : ""}`}
          onClick={() => setActiveTab("compare")}
        >
          COMPARE
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

        {/* {activeTab === "compare" && (
          <ComparePicks
            regularSeasonGames={regularSeasonGames}
            availableWeeks={getAvailableWeeks()}
          />
        )} */}

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
