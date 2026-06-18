import { useState } from 'react';
import BorderGlow from './BorderGlow.jsx';
import RankingChart, { RANK_METRICS } from './RankingChart.jsx';

export default function RankingPanel({ lookup, country, year, dark, inStack = false }) {
  const [metric, setMetric] = useState('r');

  const bg = dark ? 'rgba(13, 16, 28, 0.85)' : 'rgba(248, 249, 252, 0.90)';
  const curMeta = RANK_METRICS.find(m => m.key === metric);

  return (
    <BorderGlow
      className={inStack ? 'panel-stack-card' : 'float-panel visible'}
      backgroundColor={bg}
      borderRadius={22}
      glowRadius={5}
      glowIntensity={0.06}
      glowColor="220 80 65"
      edgeSensitivity={60}
      coneSpread={10}
      fillOpacity={0.01}
      colors={['#3b82f6', '#2563eb', '#60a5fa']}
    >
      <div className="fp-head">
        <div>
          <div className="fp-label">Global ranking — {year}</div>
          <h2>Top 10 Countries</h2>
          <div className="meta">{curMeta?.unit}</div>
        </div>
      </div>

      {/* Metric selector */}
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

      <div className="ranking-chart-wrap">
        <RankingChart
          lookup={lookup}
          year={year}
          dark={dark}
          country={country}
          metric={metric}
        />
      </div>
    </BorderGlow>
  );
}
