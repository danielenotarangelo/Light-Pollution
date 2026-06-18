import { useState } from 'react';
import BorderGlow from './BorderGlow.jsx';
import RankingChart, { RANK_METRICS } from './RankingChart.jsx';

export default function GlobalRankingPanel({ lookup, year, dark, visible, onSelect }) {
  const [metric, setMetric] = useState('r');
  const curMeta = RANK_METRICS.find(m => m.key === metric);
  const bg = dark ? 'rgba(13, 16, 28, 0.92)' : 'rgba(248, 249, 252, 0.95)';

  return (
    <div className={`global-ranking-panel${visible ? ' visible' : ''}`}>
      <BorderGlow
        className="global-ranking-inner"
        backgroundColor={bg}
        borderRadius={22}
        glowRadius={6}
        glowIntensity={0.07}
        glowColor="59 130 246"
        edgeSensitivity={80}
        coneSpread={12}
        fillOpacity={0.01}
        colors={['#3b82f6', '#2563eb', '#60a5fa']}
      >
        <div className="grp-head">
          <div>
            <div className="fp-label">Global overview · {year}</div>
            <h2>Top 10 Countries</h2>
          </div>
        </div>

        <p className="grp-hint">Click any country on the globe to explore its data</p>

        <div className="ranking-tabs">
          {RANK_METRICS.map(m => (
            <button
              key={m.key}
              className={`ranking-tab${metric === m.key ? ' active' : ''}`}
              onClick={() => setMetric(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="grp-unit">{curMeta?.unit}</div>

        <div className="grp-chart-wrap">
          <RankingChart
            lookup={lookup}
            year={year}
            dark={dark}
            country={null}
            metric={metric}
            onSelect={onSelect}
          />
        </div>
      </BorderGlow>
    </div>
  );
}
