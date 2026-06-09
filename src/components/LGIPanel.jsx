import LGIChart from './LGIChart.jsx';
import BorderGlow from './BorderGlow.jsx';
import { getSeries } from '../lib/data.js';
import { YEARS } from '../lib/constants.js';

const fmtLGI = v => {
  if (v == null || Math.abs(v) < 1e-8) return '—';
  return (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%';
};

export default function LGIPanel({ lookup, country, year, dark, open, onClose, inStack = false, bgColor, compact = false }) {
  const visible = inStack ? !!country : (!!country && open);
  const series = country ? getSeries(lookup, YEARS, country) : [];
  const cur = country && lookup[country] ? lookup[country][year] : null;
  const bg = bgColor ?? (dark ? 'rgba(13, 16, 28, 0.85)' : 'rgba(248, 249, 252, 0.90)');

  const lgiValues = series.filter(d => d.lgi != null && Math.abs(d.lgi) > 1e-8);
  const avgLGI = lgiValues.length
    ? lgiValues.reduce((sum, d) => sum + d.lgi, 0) / lgiValues.length
    : null;

  const curLGI = cur?.lgi ?? null;
  const lgiColor = v => v != null && v >= 0 ? 'var(--lgi)' : 'var(--lgr)';

  return (
    <BorderGlow
      className={inStack ? 'panel-stack-card' : `float-panel left${visible ? ' visible' : ''}`}
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
          <div className="fp-label">Year-over-year radiance change</div>
          <h2>Luminosity Growth</h2>
          {country && <div className="fp-country">{country}</div>}
          <div className="meta">{year}</div>
        </div>
        {onClose && <button className="close-x" onClick={onClose}>✕</button>}
      </div>
      <div className="stat-grid">
        <div className="stat">
          <div className="label">This year</div>
          <div className="value" style={{ color: lgiColor(curLGI) }}>
            {fmtLGI(curLGI)}
          </div>
          <div className="unit">change</div>
        </div>
        <div className="stat">
          <div className="label">Avg growth</div>
          <div className="value" style={{ color: lgiColor(avgLGI) }}>
            {fmtLGI(avgLGI)}
          </div>
          <div className="unit">per year</div>
        </div>
      </div>
      <div className="chart-title">
        <span className="dot" style={{ background: 'var(--lgi)' }} />
        Annual radiance growth rate
      </div>
      {visible && <LGIChart series={series} year={year} dark={dark} height={compact ? 150 : 200} />}
    </BorderGlow>
  );
}
