import * as d3 from 'd3';
import QuadrantChart from './QuadrantChart.jsx';
import BorderGlow from './BorderGlow.jsx';

export default function QuadrantPanel({ lookup, country, year, healthMetric = 'd', dark, open, onClose, inStack = false, bgColor, compact = false }) {
  const visible = inStack ? !!country : (!!country && open);
  const cur = country && lookup[country] ? lookup[country][year] : null;
  const bg = bgColor ?? (dark ? 'rgba(13, 16, 28, 0.85)' : 'rgba(248, 249, 252, 0.90)');

  const metricShort = healthMetric === 'd' ? 'Depressive' : 'Anxiety';

  // Compute global medians to show which quadrant the selected country is in
  const pts = [];
  for (const c in lookup) {
    const y = lookup[c][year];
    if (y && y.r != null && y[healthMetric] != null) pts.push({ r: y.r, h: y[healthMetric] });
  }
  const medR = d3.median(pts, d => d.r);
  const medH = d3.median(pts, d => d.h);

  let quadrantLabel = '—';
  if (cur?.r != null && cur[healthMetric] != null && medR != null && medH != null) {
    const bright = cur.r > medR;
    const high = cur[healthMetric] > medH;
    if (bright && high) quadrantLabel = 'Bright · high disorders';
    else if (bright && !high) quadrantLabel = 'Bright · low disorders';
    else if (!bright && high) quadrantLabel = 'Dim · high disorders';
    else quadrantLabel = 'Dim · low disorders';
  }

  return (
    <BorderGlow
      className={inStack ? 'panel-stack-card' : `float-panel right${visible ? ' visible' : ''}`}
      backgroundColor={bg}
      borderRadius={22}
      glowRadius={5}
      glowIntensity={0.06}
      glowColor="270 80 65"
      edgeSensitivity={60}
      coneSpread={10}
      fillOpacity={0.01}
      colors={['#7c3aed', '#6d28d9', '#a78bfa']}
    >
      <div className="fp-head">
        <div>
          <div className="fp-label">All countries · {year}</div>
          <h2>Radiance &amp; Health Quadrants</h2>
          {country && <div className="fp-country">{country}</div>}
          <div className="meta">Divided by global median radiance &amp; {metricShort.toLowerCase()} rate</div>
        </div>
        {onClose && <button className="close-x" onClick={onClose}>✕</button>}
      </div>
      <div className="stat-grid">
        <div className="stat">
          <div className="label">Radiance</div>
          <div className="value">{cur?.r != null ? d3.format('.2f')(cur.r) : '—'}</div>
          <div className="unit">nW/cm²/sr</div>
        </div>
        <div className="stat">
          <div className="label">{metricShort}</div>
          <div className="value" style={{ color: 'var(--health)' }}>
            {cur?.[healthMetric] != null ? d3.format(',.0f')(cur[healthMetric]) : '—'}
          </div>
          <div className="unit">/100k</div>
        </div>
      </div>
      <div className="chart-title">
        <span className="dot" style={{ background: 'var(--accent)' }} />
        {quadrantLabel}
      </div>
      {visible && (
        <QuadrantChart
          lookup={lookup}
          year={year}
          selected={country}
          healthMetric={healthMetric}
          dark={dark}
          height={compact ? 150 : 260}
        />
      )}
    </BorderGlow>
  );
}
