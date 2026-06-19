import { useState, useEffect } from 'react';
import LeftPanel from './LeftPanel.jsx';
import LGRPanel from './LGRPanel.jsx';
import QuadrantPanel from './QuadrantPanel.jsx';
import TrajectoryPanel from './TrajectoryPanel.jsx';
import EnergyPanel from './EnergyPanel.jsx';
import Stack from './Stack.jsx';

const TABS = [
  { id: 'wealth',      label: 'Wealth' },
  { id: 'health',      label: 'Health' },
  { id: 'environment', label: 'Environment' },
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

export default function RightPanel({ lookup, country, year, dark, healthMetric = 'd' }) {
  const [tab, setTab] = useState('wealth');
  const [dir, setDir] = useState('left');

  useEffect(() => { setTab('wealth'); }, [country]);

  const visible = !!country;

  const shared  = { lookup, country, year, dark, inStack: true };
  const sharedH = { ...shared, healthMetric };

  const wealthCards = [
    <LeftPanel  key="left" {...shared} />,
    <LGRPanel   key="lgr"  {...shared} />,
  ];
  const healthCards = [
    <TrajectoryPanel key="trajectory" {...sharedH} />,
    <QuadrantPanel   key="quadrant"   {...sharedH} />,
  ];
  const environmentCards = [
    <EnergyPanel key="energy" {...shared} />,
  ];

  const tabIdx  = TABS.findIndex(t => t.id === tab);
  const prevTab = () => { setDir('right'); setTab(TABS[(tabIdx - 1 + TABS.length) % TABS.length].id); };
  const nextTab = () => { setDir('left');  setTab(TABS[(tabIdx + 1) % TABS.length].id); };

  const activeCards =
    tab === 'wealth'      ? wealthCards :
    tab === 'health'      ? healthCards :
                            environmentCards;

  return (
    <div className={`right-panel${visible ? ' visible' : ''}`}>

      {/* Chart area — fills full panel height */}
      <div key={tab} className={`rp-mode-content rp-mode-content--${dir}`}>
        {country && (
          <div className="rp-stack-wrapper">
            <Stack
              key={`${tab}-${country}`}
              sendToBackOnClick
              sensitivity={180}
              cards={activeCards}
            />
          </div>
        )}
      </div>

      {/* Tab navigator — fixed below the panel */}
      <div className="rp-tab-nav">
        <button className="rp-nav-arrow" onClick={prevTab} aria-label="Previous tab">
          <ChevronLeft />
        </button>
        <span className="rp-nav-label">{TABS[tabIdx >= 0 ? tabIdx : 0].label}</span>
        <button className="rp-nav-arrow" onClick={nextTab} aria-label="Next tab">
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
