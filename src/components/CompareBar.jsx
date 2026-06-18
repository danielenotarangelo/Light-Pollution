import { useState, useRef, useEffect } from 'react';
import { getFlagEmoji } from '../utils/countryFlags.js';

export default function CompareBar({
  selected,
  compareCountry,
  compareMode,
  countries,
  onClose,
  onEnterCompare,
  onCancelCompare,
  onSelectCompare,
  onClearCompare,
}) {
  const [query,      setQuery]      = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeIdx,  setActiveIdx]  = useState(-1);
  const inputRef  = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (compareMode) inputRef.current?.focus();
    else { setQuery(''); setSuggestions([]); setActiveIdx(-1); }
  }, [compareMode]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setSuggestions([]);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    setActiveIdx(-1);
    if (!q.trim()) { setSuggestions([]); return; }
    const lower    = q.toLowerCase();
    const pool     = countries.filter(c => c !== selected);
    const starts   = pool.filter(c => c.toLowerCase().startsWith(lower));
    const contains = pool.filter(c => !c.toLowerCase().startsWith(lower) && c.toLowerCase().includes(lower));
    setSuggestions([...starts, ...contains].slice(0, 6));
  };

  const commit = (name) => {
    setQuery('');
    setSuggestions([]);
    onSelectCompare(name);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown')  { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { const t = activeIdx >= 0 ? suggestions[activeIdx] : suggestions[0]; if (t) commit(t); }
    else if (e.key === 'Escape') { onCancelCompare(); }
  };

  const flag1 = getFlagEmoji(selected);
  const flag2 = compareCountry ? getFlagEmoji(compareCountry) : null;

  return (
    <div className="compare-bar-stack">
      {/* Primary badge */}
      <div className="country-badge-center">
        <div className="country-badge-center-info">
          <span className="country-badge-center-label">Selected territory</span>
          <span className="country-badge-center-name">
            {flag1 && <span style={{ marginRight: 6 }}>{flag1}</span>}
            {selected}
          </span>
        </div>
        <button className="close-x" onClick={onClose}>✕</button>
      </div>

      {/* State 1: no compare yet */}
      {!compareMode && !compareCountry && (
        <button className="compare-trigger-btn" onClick={onEnterCompare}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M18 8l4 4-4 4M6 8l-4 4 4 4M14 4l-4 16"/>
          </svg>
          Compare with…
        </button>
      )}

      {/* State 2: compare mode active — waiting for second country */}
      {compareMode && (
        <div className="compare-picker-card" ref={wrapperRef}>
          <div className="compare-search-row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.5 }}>
              <circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/>
            </svg>
            <input
              ref={inputRef}
              className="compare-search-input"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Search a country…"
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button className="compare-clear-btn" tabIndex={-1}
                onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus(); }}>
                ✕
              </button>
            )}
          </div>

          {suggestions.length > 0 && (
            <ul className="compare-suggestions">
              {suggestions.map((s, i) => {
                const f = getFlagEmoji(s);
                return (
                  <li key={s} className={i === activeIdx ? 'active' : ''} onMouseDown={() => commit(s)}>
                    {f && <span className="suggestion-flag">{f}</span>}
                    {s}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="compare-hint">or click a country on the globe</div>
          <button className="compare-cancel-btn" onClick={onCancelCompare}>Cancel</button>
        </div>
      )}

      {/* State 3: second country selected */}
      {compareCountry && !compareMode && (
        <div className="compare-result-badge">
          <span className="compare-vs">vs</span>
          <span className="compare-result-name">
            {flag2 && <span style={{ marginRight: 6 }}>{flag2}</span>}
            {compareCountry}
          </span>
          <button className="close-x" onClick={onClearCompare}>✕</button>
        </div>
      )}
    </div>
  );
}
