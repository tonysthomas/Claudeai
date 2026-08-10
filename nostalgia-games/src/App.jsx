import { useState, useCallback } from "react";
import { games, getRandomGame } from "./data/games";
import GameCard from "./components/GameCard";
import GameInfoModal from "./components/GameInfoModal";
import ShareGameModal from "./components/ShareGameModal";
import "./App.css";

const STACK_SIZE = 2;

function buildStack(excludeIds) {
  const stack = [];
  const used = [...excludeIds];
  for (let i = 0; i < STACK_SIZE; i++) {
    const g = getRandomGame(used);
    if (!g) break;
    stack.push(g);
    used.push(g.id);
  }
  return stack;
}

export default function App() {
  const [stack, setStack] = useState(() => buildStack([]));
  const [seen, setSeen] = useState([]);
  const [sharedGames, setSharedGames] = useState([]);

  const [infoGame, setInfoGame] = useState(null);
  const [shareGame, setShareGame] = useState(null);

  const [stats, setStats] = useState({ known: 0, unknown: 0, shared: 0 });
  const [allDone, setAllDone] = useState(false);

  const refillStack = useCallback((currentSeen) => {
    const newCard = getRandomGame(currentSeen);
    if (!newCard) {
      setAllDone(true);
      return;
    }
    setStack((prev) => {
      if (prev.length >= STACK_SIZE) return prev;
      return [...prev, newCard];
    });
  }, []);

  const handleSwipe = useCallback(
    (direction, game) => {
      const newSeen = [...seen, game.id];
      setSeen(newSeen);
      setStack((prev) => prev.filter((g) => g.id !== game.id));

      if (direction === "no") {
        setInfoGame(game);
        setStats((s) => ({ ...s, unknown: s.unknown + 1 }));
      } else {
        setShareGame(game);
        setStats((s) => ({ ...s, known: s.known + 1 }));
      }

      refillStack(newSeen);
    },
    [seen, refillStack]
  );

  const handleInfoClose = () => setInfoGame(null);
  const handleShareClose = () => setShareGame(null);

  const handleShareSubmit = (newGame) => {
    const enriched = {
      ...newGame,
      id: Date.now(),
      emoji: "🎮",
      flag: "🌍",
      tags: newGame.tags.length > 0 ? newGame.tags : ["traditional"],
      submittedBy: "community",
    };
    setSharedGames((prev) => [enriched, ...prev]);
    setStats((s) => ({ ...s, shared: s.shared + 1 }));
  };

  const handleButtonSwipe = (direction) => {
    if (stack.length === 0) return;
    handleSwipe(direction, stack[0]);
  };

  const resetApp = () => {
    setSeen([]);
    setStack(buildStack([]));
    setAllDone(false);
    setStats({ known: 0, unknown: 0, shared: 0 });
  };

  const topGame = stack[0];
  const nextGame = stack[1];

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          <span className="title-icon">🌍</span>
          NostaPlay
        </h1>
        <p className="app-subtitle">Discover kids' games from around the world</p>
        <div className="stats-bar">
          <span title="Games you know" className="stat known">✓ {stats.known} known</span>
          <span title="New games discovered" className="stat unknown">? {stats.unknown} new</span>
          <span title="Games you shared" className="stat shared">🌍 {stats.shared} shared</span>
        </div>
      </header>

      <main className="card-area">
        {allDone ? (
          <div className="all-done">
            <div className="all-done-icon">🎊</div>
            <h2>You've seen them all!</h2>
            <p>
              You discovered <strong>{stats.unknown}</strong> new games and already knew{" "}
              <strong>{stats.known}</strong>.{stats.shared > 0 && ` You shared ${stats.shared} games!`}
            </p>
            {sharedGames.length > 0 && (
              <div className="shared-list">
                <h3>Community contributions:</h3>
                {sharedGames.map((g) => (
                  <div key={g.id} className="shared-item">
                    <strong>{g.name}</strong> — {g.country}
                  </div>
                ))}
              </div>
            )}
            <button className="btn-primary" onClick={resetApp}>
              Play Again 🔄
            </button>
          </div>
        ) : (
          <>
            <div className="card-stack">
              {nextGame && (
                <GameCard key={nextGame.id} game={nextGame} isTop={false} onSwipe={() => {}} />
              )}
              {topGame && (
                <GameCard key={topGame.id} game={topGame} isTop={true} onSwipe={handleSwipe} />
              )}
            </div>

            <div className="action-buttons">
              <button
                className="action-btn no-btn"
                onClick={() => handleButtonSwipe("no")}
                title="Never heard of it"
                disabled={!topGame}
              >
                <span className="btn-icon">?</span>
                <small>Never heard</small>
              </button>

              <div className="games-left">
                <span>{games.length - seen.length}</span>
                <small>left</small>
              </div>

              <button
                className="action-btn yes-btn"
                onClick={() => handleButtonSwipe("yes")}
                title="I know this game!"
                disabled={!topGame}
              >
                <span className="btn-icon">✓</span>
                <small>Know it!</small>
              </button>
            </div>
          </>
        )}
      </main>

      {infoGame && <GameInfoModal game={infoGame} onClose={handleInfoClose} />}
      {shareGame && (
        <ShareGameModal
          knownGame={shareGame}
          onClose={handleShareClose}
          onSubmit={handleShareSubmit}
        />
      )}
    </div>
  );
}
