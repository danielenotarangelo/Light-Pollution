import DualAxisChart from './DualAxisChart.jsx';
import BorderGlow from './BorderGlow.jsx';
import { fmt, getSeries } from '../lib/data.js';
import { YEARS } from '../lib/constants.js';

export default function LeftPanel({ lookup, country, year, dark, onClose }) {
  const visible = !!country;
  const series = country ? getSeries(lookup, YEARS, country) : [];
  const cur = country && lookup[country] ? lookup[country][year] : null;
  const bgColor = dark ? 'rgba(13, 16, 28, 0.85)' : 'rgba(248, 249, 252, 0.90)';

  return (
    <BorderGlow
      className={`float-panel left${visible ? ' visible' : ''}`}
      backgroundColor={bgColor}
      borderRadius={22}
      glowRadius={5}
      glowIntensity={0.06}
      glowColor="35 90 70"
      edgeSensitivity={60}
      coneSpread={10}
      fillOpacity={0.01}
      colors={['#ffb454', '#e8841a', '#5ad1a0']}
    >
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
    </BorderGlow>
  );
}
