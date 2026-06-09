import * as d3 from 'd3';
import GDPHealthChart from './GDPHealthChart.jsx';
import BorderGlow from './BorderGlow.jsx';
import { getSeries } from '../lib/data.js';
import { YEARS } from '../lib/constants.js';

function pearsonR(data) {
  const n = data.length;
  if (n < 2) return null;
  const mx = d3.mean(data, d => d.x);
  const my = d3.mean(data, d => d.y);
  const num = d3.sum(data, d => (d.x - mx) * (d.y - my));
  const den = Math.sqrt(d3.sum(data, d => (d.x - mx) ** 2) * d3.sum(data, d => (d.y - my) ** 2));
  return den < 1e-12 ? 0 : num / den;
}

export default function GDPHealthPanel({ lookup, country, year, healthMetric = 'd', dark, open, onClose, inStack = false, bgColor, compact = false }) {
  const visible = inStack ? !!country : (!!country && open);
  const series = country ? getSeries(lookup, YEARS, country) : [];
  const cur = country && lookup[country] ? lookup[country][year] : null;
  const bg = bgColor ?? (dark ? 'rgba(13, 16, 28, 0.85)' : 'rgba(248, 249, 252, 0.90)');

  const metricShort = healthMetric === 'd' ? 'Depressive' : 'Anxiety';
  const metricLabel = healthMetric === 'd' ? 'Depressive disorders' : 'Anxiety disorders';

  const corrData = series
    .filter(d => d.g != null && d[healthMetric] != null)
    .map(d => ({ x: d.g, y: d[healthMetric] }));
  const r = pearsonR(corrData);
  const fmtR = v => v == null ? '—' : (v >= 0 ? '+' : '') + v.toFixed(2);

  return (
    <BorderGlow
      className={inStack ? 'panel-stack-card' : `float-panel right${visible ? ' visible' : ''}`}
      backgroundColor={bg}
      borderRadius={22}
      glowRadius={5}
      glowIntensity={0.06}
      glowColor="160 80 65"
      edgeSensitivity={60}
      coneSpread={10}
      fillOpacity={0.01}
      colors={['#0d9488', '#0f766e', '#2dd4bf']}
    >
      <div className="fp-head">
        <div>
          <div className="fp-label">GDP &amp; mental health over time</div>
          <h2>GDP & {metricShort}</h2>
          {country && <div className="fp-country">{country}</div>}
          <div className="meta">{year}</div>
        </div>
        {onClose && <button className="close-x" onClick={onClose}>✕</button>}
      </div>
      <div className="stat-grid">
        <div className="stat">
          <div className="label">Correlation</div>
          <div className="value" style={{ color: 'var(--health)' }}>{fmtR(r)}</div>
          <div className="unit">Pearson r</div>
        </div>
        <div className="stat">
          <div className="label">{metricShort}</div>
          <div className="value" style={{ color: 'var(--health)' }}>
            {cur?.[healthMetric] != null ? d3.format(',.0f')(cur[healthMetric]) : '—'}
          </div>
          <div className="unit">/100k · {year}</div>
        </div>
      </div>
      <div className="chart-title">
        <span className="dot" style={{ background: 'var(--health)' }} />
        Green = GDP · Purple = {metricLabel}
      </div>
      {visible && (
        <GDPHealthChart
          series={series}
          year={year}
          healthMetric={healthMetric}
          dark={dark}
          height={compact ? 150 : 200}
        />
      )}
    </BorderGlow>
  );
}
