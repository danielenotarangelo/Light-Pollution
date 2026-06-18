import { useState, useEffect } from 'react';
import LeftPanel from './LeftPanel.jsx';
import LGRPanel from './LGRPanel.jsx';
import QuadrantPanel from './QuadrantPanel.jsx';
import TrajectoryPanel from './TrajectoryPanel.jsx';
import EnergyPanel from './EnergyPanel.jsx';
import Stack from './Stack.jsx';

const TABS = [
  { id: 'wealth',  label: 'Wealth'  },
  { id: 'health',  label: 'Health'  },
  { id: 'environ', label: 'Environ' },
];

export default function RightPanel({ lookup, country, year, dark, healthMetric = 'd' }) {
  const [tab, setTab] = useState('wealth');

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

  const environCards = [
    <EnergyPanel key="energy" {...shared} />,
  ];

  return (
    <div className={`right-panel${visible ? ' visible' : ''}`}>

      {/* Tab bar */}
      {country && (
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

      {/* Content */}
      <div className="rp-mode-content">
        {country && (
          <div className="rp-stack-wrapper">
            <Stack
              key={`${tab}-${country}`}
              sendToBackOnClick
              sensitivity={180}
              cards={
                tab === 'wealth'  ? wealthCards  :
                tab === 'health'  ? healthCards  :
                                    environCards
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
