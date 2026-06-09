import ScatterChart from './ScatterChart.jsx';
import BorderGlow from './BorderGlow.jsx';
import { fmt } from '../lib/data.js';

export default function RightPanel({ lookup, country, year, dark, open, onClose, inStack = false, bgColor, compact = false }) {
  const visible = inStack ? !!country : (!!country && open);
  const cur = country && lookup[country] ? lookup[country][year] : null;
  const bg = bgColor ?? (dark ? 'rgba(13, 16, 28, 0.85)' : 'rgba(248, 249, 252, 0.90)');

  return (
    <BorderGlow
      className={inStack ? 'panel-stack-card' : `float-panel right${visible ? ' visible' : ''}`}
      backgroundColor={bg}
      borderRadius={22}
      glowRadius={5}
      glowIntensity={0.06}
      glowColor="270 60 75"
      edgeSensitivity={60}
      coneSpread={10}
      fillOpacity={0.01}
      colors={['#c08cff', '#8a4fd6', '#38bdf8']}
    >
      <div className="fp-head">
        <div>
          <div className="fp-label">Health correlation</div>
          <div className="fp-title-row">
            <h2>Light &amp; the mind</h2>
            <span className="info-btn" aria-label="Interpretation note">
              i
              <div className="info-tooltip">
                Correlation is not causation. Prevalence reflects diagnosis and reporting
                capacity, which track wealth. Satellite radiance measures upward-emitted
                light, not bedroom exposure.
              </div>
            </span>
          </div>
          {country && <div className="fp-country">{country}</div>}
          <div className="meta">Radiance vs prevalence · {year}</div>
        </div>
        {onClose && <button className="close-x" onClick={onClose}>✕</button>}
      </div>
      <div className="stat-grid">
        <div className="stat">
          <div className="label">Depressive</div>
          <div className="value" style={{ color: 'var(--health)' }}>
            {cur ? fmt(cur.d, 'd') : '—'}
          </div>
          <div className="unit">/100k</div>
        </div>
        <div className="stat">
          <div className="label">Anxiety</div>
          <div className="value" style={{ color: 'var(--health)' }}>
            {cur ? fmt(cur.a, 'a') : '—'}
          </div>
          <div className="unit">/100k</div>
        </div>
      </div>
      <div className="chart-title">
        <span className="dot" style={{ background: 'var(--health)' }} />
        All countries · radiance × depression
      </div>
      {visible && <ScatterChart lookup={lookup} year={year} selected={country} dark={dark} height={compact ? 150 : 260} />}
    </BorderGlow>
  );
}
