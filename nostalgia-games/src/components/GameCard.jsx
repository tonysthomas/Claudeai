import { useSpring, animated } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { useRef } from "react";

const SWIPE_THRESHOLD = 100;

export default function GameCard({ game, onSwipe, isTop }) {
  const [{ x, y, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    scale: isTop ? 1 : 0.95,
    config: { friction: 50, tension: 800 },
  }));

  const isDragging = useRef(false);

  const bind = useDrag(
    ({ down, movement: [mx, my], velocity: [vx], direction: [dx] }) => {
      const trigger = Math.abs(mx) > SWIPE_THRESHOLD || Math.abs(vx) > 0.5;

      if (!down && trigger) {
        const direction = dx > 0 ? "yes" : "no";
        const flyOutX = direction === "yes" ? 600 : -600;
        api.start({ x: flyOutX, y: my, rotate: flyOutX / 10, scale: 1 });
        setTimeout(() => onSwipe(direction, game), 300);
        return;
      }

      if (!down) {
        api.start({ x: 0, y: 0, rotate: 0, scale: 1 });
        isDragging.current = false;
        return;
      }

      isDragging.current = true;
      api.start({
        x: mx,
        y: my,
        rotate: mx / 15,
        scale: 1.03,
        immediate: true,
      });
    },
    { filterTaps: true }
  );

  const swipeIndicatorOpacity = x.to((val) => {
    const abs = Math.abs(val);
    return Math.min(abs / SWIPE_THRESHOLD, 1);
  });

  const yesOpacity = x.to((val) => (val > 20 ? Math.min((val - 20) / 80, 1) : 0));
  const noOpacity = x.to((val) => (val < -20 ? Math.min((-val - 20) / 80, 1) : 0));

  return (
    <animated.div
      {...bind()}
      style={{
        x,
        y,
        rotate,
        scale,
        position: "absolute",
        width: "100%",
        maxWidth: "380px",
        cursor: isTop ? "grab" : "default",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      <div className="game-card">
        {/* YES label */}
        <animated.div
          className="swipe-label yes-label"
          style={{ opacity: yesOpacity }}
        >
          ✓ I Know It!
        </animated.div>

        {/* NO label */}
        <animated.div
          className="swipe-label no-label"
          style={{ opacity: noOpacity }}
        >
          ? Never Heard!
        </animated.div>

        <div className="card-header">
          <span className="game-emoji">{game.emoji}</span>
          <div className="game-meta">
            <span className="game-flag">{game.flag}</span>
            <span className="game-country">{game.country}</span>
          </div>
        </div>

        <h2 className="game-name">{game.name}</h2>

        <div className="game-details">
          <span className="detail-pill">📅 {game.era}</span>
          <span className="detail-pill">👥 {game.players} players</span>
        </div>

        <p className="game-description">{game.description}</p>

        <div className="game-tags">
          {game.tags.map((tag) => (
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}
        </div>

        {isTop && (
          <div className="swipe-hint">
            <span className="hint-no">← Never heard</span>
            <span className="hint-yes">Know it! →</span>
          </div>
        )}
      </div>
    </animated.div>
  );
}
