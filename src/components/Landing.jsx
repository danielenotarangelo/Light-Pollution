import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import './Landing.css';

const SLIDES = [
  {
    eyebrow: 'Data Visualization · 2013–2023',
    title: 'Nights of Light',
    body: 'Explore the relationship between artificial light pollution, economic development, and mental health across a decade of global data.',
    big: true,
  },
  {
    eyebrow: 'The Globe',
    title: 'Explore & Interact',
    body: 'Drag to rotate the globe, scroll to zoom, and click on any country to select it and unlock its historical data.',
    icon: 'globe',
  },
  {
    eyebrow: 'Variables',
    title: 'Three Lenses',
    body: 'Switch between Radiance (light emitted at night), GDP per capita, and mental health prevalence using the controls in the header. Each metric recolours the globe.',
    icon: 'layers',
  },
  {
    eyebrow: 'Country Data',
    title: 'Dive Deeper',
    body: 'Clicking a country opens two panels: one tracking how radiance and wealth evolved over time, and one comparing light pollution against mental health prevalence.',
    icon: 'chart',
  },
  {
    eyebrow: 'Timeline',
    title: 'A Decade of Change',
    body: 'Use the slider at the bottom to move between 2013 and 2023. Press play to animate the globe and watch global patterns shift over ten years.',
    icon: 'timeline',
  },
];

const ICONS = {
  globe: (
    <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="3.5" ry="9" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
    </svg>
  ),
  layers: (
    <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 22 8.5 12 15 2 8.5" />
      <polyline points="2 12 12 18.5 22 12" />
      <polyline points="2 16 12 22.5 22 16" />
    </svg>
  ),
  chart: (
    <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="3" y1="4" x2="3" y2="21" />
      <polyline points="6 14 10 9 14 12 19 6" />
      <circle cx="10" cy="9" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="14" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="19" cy="6" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  ),
  timeline: (
    <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      {/* play button */}
      <polygon points="3 8 8 11.5 3 15" fill="currentColor" stroke="none" />
      {/* slider track */}
      <line x1="11" y1="11.5" x2="21" y2="11.5" />
      {/* filled progress */}
      <line x1="11" y1="11.5" x2="16" y2="11.5" strokeWidth="2.2" strokeLinecap="round" />
      {/* thumb */}
      <circle cx="16" cy="11.5" r="2.2" fill="currentColor" stroke="none" />
      {/* year ticks */}
      <line x1="11" y1="14" x2="11" y2="15.5" strokeWidth="1" />
      <line x1="14" y1="14" x2="14" y2="15.5" strokeWidth="1" />
      <line x1="17" y1="14" x2="17" y2="15.5" strokeWidth="1" />
      <line x1="21" y1="14" x2="21" y2="15.5" strokeWidth="1" />
    </svg>
  ),
};

const slideVariants = {
  enter: (dir) => ({ y: dir > 0 ? 56 : -56, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (dir) => ({ y: dir > 0 ? -56 : 56, opacity: 0 }),
};

const transition = { duration: 0.36, ease: [0.4, 0, 0.2, 1] };

export default function Landing({ onEnter }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [leaving, setLeaving] = useState(false);

  const total = SLIDES.length;
  const isLast = current === total - 1;

  const goTo = useCallback((idx) => {
    if (idx === current || leaving || idx < 0 || idx >= total) return;
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }, [current, leaving, total]);

  const advance = useCallback(() => {
    if (leaving) return;
    if (isLast) {
      setLeaving(true);
      setTimeout(onEnter, 750);
    } else {
      goTo(current + 1);
    }
  }, [current, isLast, leaving, goTo, onEnter]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') advance();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goTo(current - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, goTo, current]);

  const slide = SLIDES[current];

  return (
    <div className={`landing${leaving ? ' leaving' : ''}`}>

      <div className="landing-stage">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className="landing-slide"
          >
            {slide.icon && (
              <div className="landing-icon">{ICONS[slide.icon]}</div>
            )}
            <p className="landing-eyebrow">{slide.eyebrow}</p>
            <h1 className={`landing-title${slide.big ? ' big' : ''}`}>{slide.title}</h1>
            <p className="landing-desc">{slide.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <button className="landing-arrow-btn" onClick={advance} aria-label={isLast ? 'Enter site' : 'Next slide'}>
        <svg
          className="landing-arrow"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <nav className="landing-dots" aria-label="Carousel navigation">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`landing-dot${i === current ? ' active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1} of ${total}`}
          />
        ))}
      </nav>

    </div>
  );
}
