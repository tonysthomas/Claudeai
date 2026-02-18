import { X, Globe, Users, Calendar, Lightbulb, PlayCircle } from "lucide-react";

export default function GameInfoModal({ game, onClose }) {
  if (!game) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={22} />
        </button>

        <div className="modal-header">
          <span className="modal-emoji">{game.emoji}</span>
          <div>
            <h2 className="modal-title">{game.name}</h2>
            <p className="modal-origin">
              {game.flag} {game.country}
            </p>
          </div>
        </div>

        <div className="modal-stats">
          <div className="stat-item">
            <Calendar size={16} />
            <span>{game.era}</span>
          </div>
          <div className="stat-item">
            <Users size={16} />
            <span>{game.players} players</span>
          </div>
          <div className="stat-item">
            <Globe size={16} />
            <span>{game.country}</span>
          </div>
        </div>

        <section className="modal-section">
          <h3>
            <PlayCircle size={18} /> How to Play
          </h3>
          <p>{game.howToPlay}</p>
        </section>

        <section className="modal-section">
          <h3>
            <Lightbulb size={18} /> Fun Fact
          </h3>
          <p className="fun-fact">{game.funFact}</p>
        </section>

        <div className="modal-tags">
          {game.tags.map((tag) => (
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}
        </div>

        <button className="btn-primary full-width" onClick={onClose}>
          Got it! Show me more games
        </button>
      </div>
    </div>
  );
}
