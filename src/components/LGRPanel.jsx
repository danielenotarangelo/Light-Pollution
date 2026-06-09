import LGRChart from './LGRChart.jsx';
import BorderGlow from './BorderGlow.jsx';
import { getSeries } from '../lib/data.js';
import { YEARS } from '../lib/constants.js';

const fmtLGR = v => (v == null ? '—' : (v * 1e4).toFixed(2));

const fmtChange = (cur, first) => {
  if (cur == null || first == null || Math.abs(first) < 1e-12) return '—';
  const pct = (cur - first) / first * 100;
  return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
};

export default function LGRPanel({ lookup, country, year, dark, open, onClose, inStack = false, bgColor, compact = false }) {
  const visible = inStack ? !!country : (!!country && open);
  const series = country ? getSeries(lookup, YEARS, country) : [];
  const cur = country && lookup[country] ? lookup[country][year] : null;
  const bg = bgColor ?? (dark ? 'rgba(13, 16, 28, 0.85)' : 'rgba(248, 249, 252, 0.90)');

  const firstEntry = series.find(d => d.lgr != null);

  return (
    <BorderGlow
      className={inStack ? 'panel-stack-card' : `float-panel right${visible ? ' visible' : ''}`}
      backgroundColor={bg}
      borderRadius={22}
      glowRadius={5}
      glowIntensity={0.06}
      glowColor="330 80 65"
      edgeSensitivity={60}
      coneSpread={10}
      fillOpacity={0.01}
      colors={['#ec4899', '#db2777', '#f472b6']}
    >
      <div className="fp-head">
        <div>
          <div className="fp-label">Radiance per unit of wealth</div>
          <div className="fp-title-row">
            <h2>Light / GDP Ratio</h2>
            <span className="info-btn" aria-label="Interpretation note">
              i
              <div className="info-tooltip">
                Lower values indicate more GDP per unit of emitted light. A declining ratio
                suggests the economy is growing faster than light pollution — a proxy for
                improving energy efficiency.
              </div>
            </span>
          </div>
          {country && <div className="fp-country">{country}</div>}
          <div className="meta">×10⁻⁴ · {year}</div>
        </div>
        {onClose && <button className="close-x" onClick={onClose}>✕</button>}
      </div>
      <div className="stat-grid">
        <div className="stat">
          <div className="label">Light / GDP</div>
          <div className="value" style={{ color: 'var(--lgr)' }}>
            {fmtLGR(cur?.lgr)}
          </div>
          <div className="unit">×10⁻⁴</div>
        </div>
        <div className="stat">
          <div className="label">Since 2013</div>
          <div className="value" style={{ color: 'var(--lgr)' }}>
            {fmtChange(cur?.lgr, firstEntry?.lgr)}
          </div>
          <div className="unit">change</div>
        </div>
      </div>
      <div className="chart-title">
        <span className="dot" style={{ background: 'var(--lgr)' }} />
        Radiance-to-GDP ratio trend
      </div>
      {visible && <LGRChart series={series} year={year} dark={dark} height={compact ? 150 : 200} />}
    </BorderGlow>
  );
}
