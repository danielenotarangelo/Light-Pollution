import DualAxisChart from './DualAxisChart.jsx';
import { fmt, getSeries } from '../lib/data.js';
import { YEARS } from '../lib/constants.js';

export default function LeftPanel({ lookup, country, year, dark, onClose }) {
  const visible = !!country;
  const series = country ? getSeries(lookup, YEARS, country) : [];
  const cur = country && lookup[country] ? lookup[country][year] : null;

  return (
    <div className={`float-panel left${visible ? ' visible' : ''}`}>
      <div className="fp-head">
        <div>
          <div className="fp-label">Selected territory</div>
          <h2>{country || '—'}</h2>
          <div className="meta">
            {series.length} years · {year}
          </div>
        </div>
        <button className="close-x" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="stat-grid">
        <div className="stat">
          <div className="label">Radiance</div>
          <div className="value" style={{ color: 'var(--radiance)' }}>
            {cur ? fmt(cur.r, 'r') : '—'}
          </div>
          <div className="unit">nW/cm²/sr</div>
        </div>
        <div className="stat">
          <div className="label">GDP / capita</div>
          <div className="value" style={{ color: 'var(--gdp)' }}>
            {cur ? fmt(cur.g, 'g') : '—'}
          </div>
          <div className="unit">USD</div>
        </div>
      </div>
      <div className="chart-title">
        <span className="dot" style={{ background: 'var(--radiance)' }} />
        Light vs <span className="dot" style={{ background: 'var(--gdp)' }} />
        Wealth over time
      </div>
      {visible && <DualAxisChart series={series} year={year} dark={dark} />}
    </div>
  );
}
