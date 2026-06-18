import { useState } from 'react';
import BorderGlow from './BorderGlow.jsx';
import RankingChart, { RANK_METRICS } from './RankingChart.jsx';
import ChartModal from './ChartModal.jsx';

export default function RankingPanel({ lookup, country, year, dark, inStack = false }) {
  const [metric,   setMetric]   = useState('r');
  const [expanded, setExpanded] = useState(false);

  const bg      = dark ? 'rgba(13, 16, 28, 0.85)' : 'rgba(248, 249, 252, 0.90)';
  const curMeta = RANK_METRICS.find(m => m.key === metric);

  return (
    <>
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
          <div className="fp-head-actions">
            <button
              className="zoom-btn"
              onClick={e => { e.stopPropagation(); setExpanded(true); }}
              title="Expand ranking"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
            </button>
          </div>
        </div>

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
            topN={10}
          />
        </div>
      </BorderGlow>

      {expanded && (
        <ChartModal
          title="Full Global Ranking"
          subtitle={curMeta?.unit}
          meta={String(year)}
          onClose={() => setExpanded(false)}
        >
          <div className="ranking-tabs" style={{ marginBottom: 14 }}>
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
          <RankingChart
            lookup={lookup}
            year={year}
            dark={dark}
            country={country}
            metric={metric}
            topN={null}
          />
        </ChartModal>
      )}
    </>
  );
}
