import * as d3 from 'd3';
import TrajectoryChart from './TrajectoryChart.jsx';
import BorderGlow from './BorderGlow.jsx';
import { getSeries } from '../lib/data.js';
import { YEARS } from '../lib/constants.js';

const fmtSigned = (v, fn) => v == null ? '—' : (v >= 0 ? '+' : '') + fn(v);

export default function TrajectoryPanel({ lookup, country, year, healthMetric = 'd', dark, open, onClose, inStack = false, bgColor, compact = false }) {
  const visible = inStack ? !!country : (!!country && open);
  const series = country ? getSeries(lookup, YEARS, country) : [];
  const bg = bgColor ?? (dark ? 'rgba(13, 16, 28, 0.85)' : 'rgba(248, 249, 252, 0.90)');

  const metricShort = healthMetric === 'd' ? 'Depressive' : 'Anxiety';

  // Delta from first to last available point
  const valid = series.filter(d => d.r != null && d[healthMetric] != null);
  const first = valid[0];
  const last = valid[valid.length - 1];
  const deltaR = first && last ? last.r - first.r : null;
  const deltaH = first && last ? last[healthMetric] - first[healthMetric] : null;

  const yearRange = first && last ? `${first.year}→${last.year}` : '—';

  return (
    <BorderGlow
      className={inStack ? 'panel-stack-card' : `float-panel right${visible ? ' visible' : ''}`}
      backgroundColor={bg}
      borderRadius={22}
      glowRadius={5}
      glowIntensity={0.06}
      glowColor="190 80 65"
      edgeSensitivity={60}
      coneSpread={10}
      fillOpacity={0.01}
      colors={['#0891b2', '#0e7490', '#67e8f9']}
    >
      <div className="fp-head">
        <div>
          <div className="fp-label">Temporal path in radiance × health space</div>
          <h2>Trajectory</h2>
          {country && <div className="fp-country">{country}</div>}
          <div className="meta">{yearRange} · ring = {year}</div>
        </div>
        {onClose && <button className="close-x" onClick={onClose}>✕</button>}
      </div>
      <div className="stat-grid">
        <div className="stat">
          <div className="label">Δ Radiance</div>
          <div className="value" style={{ color: deltaR == null ? undefined : deltaR >= 0 ? 'var(--lgi)' : 'var(--lgr)' }}>
            {fmtSigned(deltaR, v => d3.format('.2f')(Math.abs(v)))}
          </div>
          <div className="unit">nW/cm²/sr</div>
        </div>
        <div className="stat">
          <div className="label">Δ {metricShort}</div>
          <div className="value" style={{ color: 'var(--health)' }}>
            {fmtSigned(deltaH, v => d3.format(',.0f')(Math.abs(v)))}
          </div>
          <div className="unit">/100k</div>
        </div>
      </div>
      <div className="chart-title">
        <span className="dot" style={{ background: 'var(--accent)' }} />
        Purple→yellow = 2013→2023 · arrow = direction
      </div>
      {visible && (
        <TrajectoryChart
          series={series}
          year={year}
          healthMetric={healthMetric}
          dark={dark}
          height={compact ? 150 : 220}
        />
      )}
    </BorderGlow>
  );
}
