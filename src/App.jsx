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
  query,
  orderBy,
} from "firebase/firestore";
import "./App.css";

// Firebase configuration - Replace with your Firebase project config
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

// Initial playoff games structure
const INITIAL_GAMES = [
  // Wild Card Round
  {
    id: "wc1",
    round: "Wild Card",
    matchup: "TBD vs TBD",
    home: "TBD",
    away: "TBD",
    winner: null,
    points: 1,
  },
  {
    id: "wc2",
    round: "Wild Card",
    matchup: "TBD vs TBD",
    home: "TBD",
    away: "TBD",
    winner: null,
    points: 1,
  },
  {
    id: "wc3",
    round: "Wild Card",
    matchup: "TBD vs TBD",
    home: "TBD",
    away: "TBD",
    winner: null,
    points: 1,
  },
  {
    id: "wc4",
    round: "Wild Card",
    matchup: "TBD vs TBD",
    home: "TBD",
    away: "TBD",
    winner: null,
    points: 1,
  },
  {
    id: "wc5",
    round: "Wild Card",
    matchup: "TBD vs TBD",
    home: "TBD",
    away: "TBD",
    winner: null,
    points: 1,
  },
  {
    id: "wc6",
    round: "Wild Card",
    matchup: "TBD vs TBD",
    home: "TBD",
    away: "TBD",
    winner: null,
    points: 1,
  },
  // Divisional Round
  {
    id: "div1",
    round: "Divisional",
    matchup: "TBD vs TBD",
    home: "TBD",
    away: "TBD",
    winner: null,
    points: 2,
  },
  {
    id: "div2",
    round: "Divisional",
    matchup: "TBD vs TBD",
    home: "TBD",
    away: "TBD",
    winner: null,
    points: 2,
  },
  {
    id: "div3",
    round: "Divisional",
    matchup: "TBD vs TBD",
    home: "TBD",
    away: "TBD",
    winner: null,
    points: 2,
  },
  {
    id: "div4",
    round: "Divisional",
    matchup: "TBD vs TBD",
    home: "TBD",
    away: "TBD",
    winner: null,
    points: 2,
  },
  // Championship Round
  {
    id: "afc",
    round: "Conference",
    matchup: "AFC Championship",
    home: "TBD",
    away: "TBD",
    winner: null,
    points: 3,
  },
  {
    id: "nfc",
    round: "Conference",
    matchup: "NFC Championship",
    home: "TBD",
    away: "TBD",
    winner: null,
    points: 3,
  },
  // Super Bowl
  {
    id: "sb",
    round: "Super Bowl",
    matchup: "Super Bowl LIX",
    home: "TBD",
    away: "TBD",
    winner: null,
    points: 5,
  },
];

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [games, setGames] = useState([]);
  const [userPicks, setUserPicks] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState("picks");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if user is admin
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setIsAdmin(userDoc.data().isAdmin || false);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Load games
  useEffect(() => {
    const loadGames = async () => {
      const gamesDoc = await getDoc(doc(db, "config", "games"));
      if (gamesDoc.exists()) {
        setGames(gamesDoc.data().games);
      } else {
        // Initialize games if they don't exist
        await setDoc(doc(db, "config", "games"), { games: INITIAL_GAMES });
        setGames(INITIAL_GAMES);
      }
    };
    loadGames();

    // Listen for game updates
    const unsubscribe = onSnapshot(doc(db, "config", "games"), (doc) => {
      if (doc.exists()) {
        setGames(doc.data().games);
      }
    });
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

  // Load leaderboard
  useEffect(() => {
    const loadLeaderboard = async () => {
      const picksSnapshot = await getDocs(collection(db, "picks"));
      const usersSnapshot = await getDocs(collection(db, "users"));

      const userMap = {};
      usersSnapshot.forEach((doc) => {
        userMap[doc.id] = doc.data().displayName || "Anonymous";
      });

      const scores = [];
      picksSnapshot.forEach((doc) => {
        const picks = doc.data().picks || {};
        let score = 0;

        games.forEach((game) => {
          if (game.winner && picks[game.id] === game.winner) {
            score += game.points;
          }
        });

        scores.push({
          uid: doc.id,
          name: userMap[doc.id] || "Anonymous",
          score,
        });
      });

      scores.sort((a, b) => b.score - a.score);
      setLeaderboard(scores);
    };

    if (games.length > 0) {
      loadLeaderboard();
      // Refresh every 10 seconds
      const interval = setInterval(loadLeaderboard, 10000);
      return () => clearInterval(interval);
    }
  }, [games]);

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

    const newPicks = { ...userPicks, [gameId]: team };
    await updateDoc(doc(db, "picks", user.uid), { picks: newPicks });
  };

  const handleUpdateGame = async (gameId, field, value) => {
    if (!isAdmin) return;

    const updatedGames = games.map((g) =>
      g.id === gameId ? { ...g, [field]: value } : g
    );
    await updateDoc(doc(db, "config", "games"), { games: updatedGames });
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
          <h1 className="auth-title">GRIDIRON GURU</h1>
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

  const groupedGames = games.reduce((acc, game) => {
    if (!acc[game.round]) acc[game.round] = [];
    acc[game.round].push(game);
    return acc;
  }, {});

  const userScore = leaderboard.find((l) => l.uid === user.uid)?.score || 0;
  const userRank = leaderboard.findIndex((l) => l.uid === user.uid) + 1;

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="header-title">PLAYOFF PICK'EM</h1>
          <div className="header-score">
            <div className="score-value">{userScore}</div>
            <div className="score-label">POINTS</div>
          </div>
        </div>
        {userRank > 0 && <div className="rank-badge">#{userRank}</div>}
      </header>

      <nav className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === "picks" ? "active" : ""}`}
          onClick={() => setActiveTab("picks")}
        >
          MY PICKS
        </button>
        <button
          className={`nav-tab ${activeTab === "leaderboard" ? "active" : ""}`}
          onClick={() => setActiveTab("leaderboard")}
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
        {activeTab === "picks" && (
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
        )}

        {activeTab === "leaderboard" && (
          <div className="leaderboard-container">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.uid}
                className={`leaderboard-entry ${
                  entry.uid === user.uid ? "current-user" : ""
                }`}
              >
                <div className="leaderboard-rank">#{index + 1}</div>
                <div className="leaderboard-name">{entry.name}</div>
                <div className="leaderboard-score">{entry.score}</div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <div className="empty-state">No picks yet. Be the first!</div>
            )}
          </div>
        )}

        {activeTab === "admin" && isAdmin && (
          <div className="admin-container">
            <h2 className="admin-title">Manage Games</h2>
            {games.map((game) => (
              <div key={game.id} className="admin-game-card">
                <div className="admin-game-header">{game.matchup}</div>
                <div className="admin-inputs">
                  <input
                    type="text"
                    placeholder="Away Team"
                    value={game.away}
                    onChange={(e) =>
                      handleUpdateGame(game.id, "away", e.target.value)
                    }
                    className="admin-input"
                  />
                  <input
                    type="text"
                    placeholder="Home Team"
                    value={game.home}
                    onChange={(e) =>
                      handleUpdateGame(game.id, "home", e.target.value)
                    }
                    className="admin-input"
                  />
                  <select
                    value={game.winner || ""}
                    onChange={(e) =>
                      handleUpdateGame(
                        game.id,
                        "winner",
                        e.target.value || null
                      )
                    }
                    className="admin-select"
                  >
                    <option value="">No Winner</option>
                    <option value={game.away}>{game.away}</option>
                    <option value={game.home}>{game.home}</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <button onClick={() => signOut(auth)} className="sign-out-button">
        SIGN OUT
      </button>
    </div>
  );
}

export default App;
