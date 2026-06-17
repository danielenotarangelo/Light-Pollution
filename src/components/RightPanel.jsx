import { useState, useEffect } from 'react';
import LeftPanel from './LeftPanel.jsx';
import LGRPanel from './LGRPanel.jsx';
import QuadrantPanel from './QuadrantPanel.jsx';
import TrajectoryPanel from './TrajectoryPanel.jsx';
import Stack from './Stack.jsx';

const MODES = [
  { id: 'country', label: 'Country' },
  { id: 'compare', label: 'Compare' },
  { id: 'ranking', label: 'Ranking' },
];

const TABS = [
  { id: 'wealth', label: 'Wealth' },
  { id: 'health', label: 'Health' },
];

function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="11,4 6,9 11,14" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="7,4 12,9 7,14" />
    </svg>
  );
}

export default function RightPanel({ lookup, country, year, dark, healthMetric = 'd', mode, onModeChange, onClose }) {
  const [tab, setTab] = useState('wealth');
  const [dir, setDir] = useState('right');

  useEffect(() => { setTab('wealth'); }, [country]);
  useEffect(() => { setTab('wealth'); }, [mode]);

  const visible = mode !== 'country' || !!country;

  const shared  = { lookup, country, year, dark, inStack: true };
  const sharedH = { ...shared, healthMetric };

  const wealthCards = [
    <LeftPanel key="left" {...shared} />,
    <LGRPanel  key="lgr"  {...shared} />,
  ];

  const healthCards = [
    <TrajectoryPanel key="trajectory" {...sharedH} />,
    <QuadrantPanel   key="quadrant"   {...sharedH} />,
  ];

  const modeIdx = MODES.findIndex(m => m.id === mode);
  const prevMode = () => { setDir('right'); onModeChange(MODES[(modeIdx - 1 + MODES.length) % MODES.length].id); };
  const nextMode = () => { setDir('left');  onModeChange(MODES[(modeIdx + 1) % MODES.length].id); };

  return (
    <div className={`right-panel${visible ? ' visible' : ''}`}>

      {/* Wealth/Health toggle — absolute overlay at the top of the panel */}
      {mode === 'country' && country && (
        <div className="rp-card-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`rp-card-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Chart area — fills full panel height (same as left panel) */}
      <div key={mode} className={`rp-mode-content rp-mode-content--${dir}`}>
        {mode === 'country' && country && (
          <div className="rp-stack-wrapper">
            <Stack
              key={`${tab}-${country}`}
              sendToBackOnClick
              sensitivity={180}
              cards={tab === 'wealth' ? wealthCards : healthCards}
            />
          </div>
        )}

        {mode === 'compare' && (
          <div className="rp-compare-wrapper">
            <QuadrantPanel
              lookup={lookup}
              country={country}
              year={year}
              dark={dark}
              healthMetric={healthMetric}
              inStack={true}
            />
          </div>
        )}

        {mode === 'ranking' && (
          <div className="rp-panel-card rp-panel-card--center">
            <span className="rp-coming-soon-text">Ranking — coming soon</span>
          </div>
        )}
      </div>

      {/* Mode navigator — absolute overlay at the bottom of the panel */}
      <div className="rp-mode-nav">
        <button className="rp-nav-arrow" onClick={prevMode} aria-label="Previous mode">
          <ChevronLeft />
        </button>
        <span className="rp-nav-label">{MODES[modeIdx >= 0 ? modeIdx : 0]?.label}</span>
        <button className="rp-nav-arrow" onClick={nextMode} aria-label="Next mode">
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
