import { useState } from 'react';
import DualAxisChart from './DualAxisChart.jsx';
import BorderGlow from './BorderGlow.jsx';
import ChartModal from './ChartModal.jsx';
import { fmt, getSeries } from '../lib/data.js';
import { YEARS } from '../lib/constants.js';

export default function LeftPanel({ lookup, country, year, dark, open, onClose, inStack = false, inTab = false, bgColor, compact = false }) {
  const [zoomed, setZoomed] = useState(false);
  const visible = inTab ? !!country : (inStack ? !!country : (!!country && open));
  const series = country ? getSeries(lookup, YEARS, country) : [];
  const cur = country && lookup[country] ? lookup[country][year] : null;
  const bg = bgColor ?? (dark ? 'rgba(13, 16, 28, 0.85)' : 'rgba(248, 249, 252, 0.90)');

  return (
    <BorderGlow
      className={inTab ? 'panel-tab-card' : (inStack ? 'panel-stack-card' : `float-panel left${visible ? ' visible' : ''}`)}
      backgroundColor={bg}
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
          <div className="fp-label">Radiance &amp; GDP per capita</div>
          <h2>Light &amp; Wealth</h2>
          {country && <div className="fp-country">{country}</div>}
          <div className="meta">{year}</div>
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
        Light <span className="dot" style={{ background: 'var(--gdp)' }} />
        Wealth
      </div>
      {visible && <DualAxisChart series={series} year={year} dark={dark} height={inStack ? null : (compact ? 150 : 240)} />}
      {zoomed && (
        <ChartModal title="Light & Wealth" subtitle="Radiance & GDP per capita" country={country} meta={String(year)} onClose={() => setZoomed(false)}>
          <DualAxisChart series={series} year={year} dark={dark} height={400} />
        </ChartModal>
      )}
    </BorderGlow>
  );
}
