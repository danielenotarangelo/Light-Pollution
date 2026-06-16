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

export default function RightPanel({ lookup, country, year, dark, healthMetric = 'd', mode, onModeChange, onClose }) {
  const [tab, setTab] = useState('wealth');

  useEffect(() => { setTab('wealth'); }, [country]);
  useEffect(() => { setTab('wealth'); }, [mode]);

  // Hide panel in country mode when no country is selected
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

  return (
    <div className={`right-panel${visible ? ' visible' : ''}`}>
      {/* Mode selector — always on top, outside the card */}
      <div className="rp-mode-bar">
        {MODES.map(m => (
          <button
            key={m.id}
            className={`rp-mode-btn${mode === m.id ? ' active' : ''}`}
            onClick={() => onModeChange(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Country mode */}
      {mode === 'country' && country && (
        <>
          {/* Bordered card container: tabs + stack */}
          <div className="rp-panel-card">
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
            <div className="rp-body rp-body--stack">
              <Stack
                key={`${tab}-${country}`}
                sendToBackOnClick
                sensitivity={180}
                cards={tab === 'wealth' ? wealthCards : healthCards}
              />
            </div>
          </div>
        </>
      )}

      {/* Compare mode */}
      {mode === 'compare' && (
        <div className="rp-panel-card">
          <QuadrantPanel
            lookup={lookup}
            country={country}
            year={year}
            dark={dark}
            healthMetric={healthMetric}
            inTab={true}
          />
        </div>
      )}

      {/* Ranking mode */}
      {mode === 'ranking' && (
        <div className="rp-panel-card rp-panel-card--center">
          <span className="rp-coming-soon-text">Ranking — coming soon</span>
        </div>
      )}
    </div>
  );
}
