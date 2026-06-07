import { useEffect, useRef } from 'react';
import { YEARS, YEAR_CAPTIONS } from '../lib/constants.js';

export default function Timeline({ year, onYearChange, playing, onTogglePlay }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        onYearChange((prev) => {
          const next = prev + 1;
          return next > YEARS[YEARS.length - 1] ? YEARS[0] : next;
        });
      }, 1100);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, onYearChange]);

  const min = YEARS[0];
  const max = YEARS[YEARS.length - 1];
  const pct = ((year - min) / (max - min)) * 100;

  return (
    <div className="timeline">
      <div className="tl-head">
        <div className="year-display">{year}</div>
        <div className="year-caption">{YEAR_CAPTIONS[year] || ''}</div>
      </div>
      <div className="tl-controls">
        <button className="play-btn" onClick={onTogglePlay}>
          {playing ? '❚❚' : '▶'}
        </button>
        <div className="slider-track">
          <div className="slider-line" />
          <div className="slider-progress" style={{ width: pct + '%' }} />
          <div className="ticks">
            {YEARS.map((y) => (
              <div
                key={y}
                className={`tick${y <= year ? ' passed' : ''}`}
                data-year={y}
                onClick={() => onYearChange(y)}
              />
            ))}
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={1}
            value={year}
            onChange={(e) => onYearChange(+e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
