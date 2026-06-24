import { motion, useMotionValue, useTransform } from 'motion/react';
import { useState, useEffect } from 'react';
import './Stack.css';

function CardRotate({ children, onSendToBack, sensitivity, disableDrag = false }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [60, -60]);
  const rotateY = useTransform(x, [-100, 100], [-60, 60]);

  function handleDragEnd(_, info) {
    if (Math.abs(info.offset.x) > sensitivity || Math.abs(info.offset.y) > sensitivity) {
      onSendToBack();
    } else {
      x.set(0);
      y.set(0);
    }
  }

  if (disableDrag) {
    return (
      <motion.div className="card-rotate-disabled" style={{ x: 0, y: 0 }}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="card-rotate"
      style={{ x, y, rotateX, rotateY }}
      drag
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={0.6}
      whileTap={{ cursor: 'grabbing' }}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  );
}

export default function Stack({
  randomRotation = false,
  sensitivity = 200,
  cards = [],
  animationConfig = { stiffness: 260, damping: 20 },
  sendToBackOnClick = false,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  mobileClickOnly = false,
  mobileBreakpoint = 768,
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < mobileBreakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [mobileBreakpoint]);

  const shouldDisableDrag = mobileClickOnly && isMobile;
  const shouldEnableClick = sendToBackOnClick || shouldDisableDrag;

  // Store order as indices into `cards` — front card is last.
  // Initialise reversed so cards[0] is on top.
  const [order, setOrder] = useState(() => cards.map((_, i) => i).reverse());

  // Sync order length when card count changes; preserve existing order for known indices.
  useEffect(() => {
    setOrder(prev => {
      if (prev.length === cards.length) return prev;
      return cards.map((_, i) => i).reverse();
    });
  }, [cards.length]);

  const sendToBack = (idx) => {
    setOrder(prev => {
      const next = [...prev];
      const pos = next.indexOf(idx);
      if (pos === -1) return prev;
      next.splice(pos, 1);
      next.unshift(idx);
      return next;
    });
  };

  useEffect(() => {
    if (autoplay && order.length > 1 && !isPaused) {
      const interval = setInterval(() => {
        sendToBack(order[order.length - 1]);
      }, autoplayDelay);
      return () => clearInterval(interval);
    }
  }, [autoplay, autoplayDelay, order, isPaused]);

  return (
    <div
      className="stack-container"
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {order.map((cardIdx, stackPos) => {
        const backOffset = order.length - stackPos - 1;
        return (
          <CardRotate
            key={cardIdx}
            onSendToBack={() => sendToBack(cardIdx)}
            sensitivity={sensitivity}
            disableDrag={shouldDisableDrag}
          >
            <motion.div
              className="card"
              onClick={() => shouldEnableClick && sendToBack(cardIdx)}
              animate={{
                scale: 1 - backOffset * 0.05,
                y: -backOffset * 20,
                rotateZ: 0,
              }}
              initial={false}
              transition={{
                type: 'spring',
                stiffness: animationConfig.stiffness,
                damping: animationConfig.damping,
              }}
            >
              {cards[cardIdx]}
            </motion.div>
          </CardRotate>
        );
      })}
    </div>
  );
}
