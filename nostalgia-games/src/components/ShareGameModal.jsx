import { useState } from "react";
import { X, Plus, Globe, Users, Calendar, Tag } from "lucide-react";

const REGIONS = [
  "Africa", "Asia", "Europe", "Middle East",
  "North America", "South America", "Oceania", "Worldwide",
];

const TAG_OPTIONS = [
  "outdoor", "indoor", "team", "solo", "skill", "strategy",
  "running", "jumping", "throwing", "collectible", "traditional",
  "music", "dance", "ancient", "1990s", "sport",
];

export default function ShareGameModal({ knownGame, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: "",
    country: "",
    region: "",
    era: "",
    players: "",
    description: "",
    howToPlay: "",
    funFact: "",
    tags: [],
  });

  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const toggleTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Game name is required";
    if (!form.country.trim()) newErrors.country = "Country is required";
    if (!form.description.trim()) newErrors.description = "Description is required";
    if (!form.howToPlay.trim()) newErrors.howToPlay = "How to play is required";
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSubmit(form);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content success-modal" onClick={(e) => e.stopPropagation()}>
          <div className="success-icon">🎉</div>
          <h2>Game Shared!</h2>
          <p>
            Thanks for sharing <strong>{form.name}</strong> from {form.country}!
          </p>
          <p className="success-subtitle">
            Other kids around the world will learn about this game.
          </p>
          <button className="btn-primary" onClick={onClose}>
            Keep Exploring!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content share-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={22} />
        </button>

        <div className="share-header">
          <span className="share-icon">✋</span>
          <div>
            <h2>Share a Game!</h2>
            <p>
              You know <strong>{knownGame?.name}</strong> — do you know another
              nostalgic game others might not?
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="share-form">
          <div className="form-row">
            <div className={`form-group ${errors.name ? "has-error" : ""}`}>
              <label>
                <Plus size={14} /> Game Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Five Stones"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
              {errors.name && <span className="error-msg">{errors.name}</span>}
            </div>

            <div className={`form-group ${errors.country ? "has-error" : ""}`}>
              <label>
                <Globe size={14} /> Country / Origin *
              </label>
              <input
                type="text"
                placeholder="e.g. Malaysia"
                value={form.country}
                onChange={(e) => handleChange("country", e.target.value)}
              />
              {errors.country && <span className="error-msg">{errors.country}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                <Globe size={14} /> Region
              </label>
              <select
                value={form.region}
                onChange={(e) => handleChange("region", e.target.value)}
              >
                <option value="">Select region...</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                <Calendar size={14} /> Era / Decade
              </label>
              <input
                type="text"
                placeholder="e.g. 1970s–1990s"
                value={form.era}
                onChange={(e) => handleChange("era", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>
                <Users size={14} /> Players
              </label>
              <input
                type="text"
                placeholder="e.g. 2–8"
                value={form.players}
                onChange={(e) => handleChange("players", e.target.value)}
              />
            </div>
          </div>

          <div className={`form-group ${errors.description ? "has-error" : ""}`}>
            <label>Description *</label>
            <textarea
              placeholder="Briefly describe the game..."
              rows={2}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
            {errors.description && (
              <span className="error-msg">{errors.description}</span>
            )}
          </div>

          <div className={`form-group ${errors.howToPlay ? "has-error" : ""}`}>
            <label>How to Play *</label>
            <textarea
              placeholder="Explain the rules step by step..."
              rows={3}
              value={form.howToPlay}
              onChange={(e) => handleChange("howToPlay", e.target.value)}
            />
            {errors.howToPlay && (
              <span className="error-msg">{errors.howToPlay}</span>
            )}
          </div>

          <div className="form-group">
            <label>Fun Fact (optional)</label>
            <textarea
              placeholder="Any interesting history or trivia..."
              rows={2}
              value={form.funFact}
              onChange={(e) => handleChange("funFact", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>
              <Tag size={14} /> Tags
            </label>
            <div className="tag-picker">
              {TAG_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-option ${form.tags.includes(tag) ? "selected" : ""}`}
                  onClick={() => toggleTag(tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Share Game 🌍
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
