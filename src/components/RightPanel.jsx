import ScatterChart from './ScatterChart.jsx';
import { fmt } from '../lib/data.js';

export default function RightPanel({ lookup, country, year, dark }) {
  const visible = !!country;
  const cur = country && lookup[country] ? lookup[country][year] : null;

  return (
    <div className={`float-panel right${visible ? ' visible' : ''}`}>
      <div className="fp-head">
        <div>
          <div className="fp-label">Health correlation</div>
          <h2>Light &amp; the mind</h2>
          <div className="meta">Radiance vs prevalence · {year}</div>
        </div>
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
      {visible && <ScatterChart lookup={lookup} year={year} selected={country} dark={dark} />}
      <div className="disclaimer">
        <strong>On interpretation.</strong> Correlation is not causation. Prevalence reflects
        diagnosis and reporting capacity, which track wealth. Satellite radiance measures
        upward-emitted light, not bedroom exposure.
      </div>
    </div>
  );
}
