import { useState } from 'react';
import * as d3 from 'd3';
import TrajectoryChart from './TrajectoryChart.jsx';
import BorderGlow from './BorderGlow.jsx';
import ChartModal from './ChartModal.jsx';
import { getSeries } from '../lib/data.js';
import { YEARS } from '../lib/constants.js';

const fmtSigned = (v, fn) => v == null ? '—' : (v >= 0 ? '+' : '') + fn(v);

export default function TrajectoryPanel({ lookup, country, year, healthMetric = 'd', dark, open, onClose, inStack = false, inTab = false, bgColor, compact = false }) {
  const [zoomed, setZoomed] = useState(false);
  const [metric, setMetric] = useState(healthMetric);
  const visible = inTab ? !!country : (inStack ? !!country : (!!country && open));
  const series = country ? getSeries(lookup, YEARS, country) : [];
  const bg = bgColor ?? (dark ? 'rgba(13, 16, 28, 0.85)' : 'rgba(248, 249, 252, 0.90)');

  const metricShort = metric === 'd' ? 'Depressive' : 'Anxiety';

  // Delta from first to last available point
  const valid = series.filter(d => d.r != null && d[metric] != null);
  const first = valid[0];
  const last = valid[valid.length - 1];
  const deltaR = first && last ? last.r - first.r : null;
  const deltaH = first && last ? last[metric] - first[metric] : null;

  const yearRange = first && last ? `${first.year}→${last.year}` : '—';

  return (
    <BorderGlow
      className={inTab ? 'panel-tab-card' : (inStack ? 'panel-stack-card' : `float-panel right${visible ? ' visible' : ''}`)}
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
          <div className="fp-label">How light pollution & mental health evolved together</div>
          <h2>Trajectory</h2>
          {country && <div className="fp-country">{country}</div>}
          <div className="meta">{yearRange} · circle marks {year}</div>
          <div className="panel-metric-toggle">
            <button className={`panel-metric-btn${metric === 'd' ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setMetric('d'); }}>Depressive</button>
            <button className={`panel-metric-btn${metric === 'a' ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setMetric('a'); }}>Anxiety</button>
          </div>
        </div>
        <div className="fp-head-actions">
          {country && <button className="zoom-btn" onClick={e => { e.stopPropagation(); setZoomed(true); }} title="Expand chart">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </button>}
          {onClose && <button className="close-x" onClick={onClose}>✕</button>}
        </div>
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
        Earlier years (purple) → recent years (yellow) · arrow shows direction
      </div>
      {visible && (
        <TrajectoryChart
          series={series}
          year={year}
          healthMetric={metric}
          dark={dark}
          height={compact ? 150 : 220}
        />
      )}
      {zoomed && (
        <ChartModal title="Trajectory" subtitle="How light pollution & mental health evolved together" country={country} meta={`${yearRange} · circle marks ${year}`} onClose={() => setZoomed(false)}>
          <TrajectoryChart series={series} year={year} healthMetric={metric} dark={dark} height={400} />
        </ChartModal>
      )}
    </BorderGlow>
  );
}
