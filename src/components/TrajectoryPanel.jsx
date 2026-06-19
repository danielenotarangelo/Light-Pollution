import { useState } from 'react';
import * as d3 from 'd3';
import TrajectoryChart from './TrajectoryChart.jsx';
import BorderGlow from './BorderGlow.jsx';
import ChartModal from './ChartModal.jsx';
import { getSeries } from '../lib/data.js';
import { YEARS } from '../lib/constants.js';

const COLOR_A = '#f59e0b';
const COLOR_B = '#38bdf8';

const fmtSigned = (v, fn) => v == null ? '—' : (v >= 0 ? '+' : '') + fn(v);

export default function TrajectoryPanel({ lookup, country, compareCountry, year, healthMetric = 'd', dark, open, onClose, inStack = false, inTab = false, bgColor, compact = false }) {
  const [zoomed, setZoomed] = useState(false);
  const [metric, setMetric] = useState(healthMetric);
  const visible = inTab ? !!country : (inStack ? !!country : (!!country && open));
  const series        = country        ? getSeries(lookup, YEARS, country)        : [];
  const compareSeries = compareCountry ? getSeries(lookup, YEARS, compareCountry) : null;
  const bg = bgColor ?? (dark ? 'rgba(13, 16, 28, 0.85)' : 'rgba(248, 249, 252, 0.90)');

  const metricShort = metric === 'd' ? 'Depressive' : 'Anxiety';

  const valid    = series.filter(d => d.r != null && d[metric] != null);
  const first    = valid[0];
  const last     = valid[valid.length - 1];
  const deltaR   = first && last ? last.r - first.r : null;
  const deltaH   = first && last ? last[metric] - first[metric] : null;

  const validCmp  = (compareSeries || []).filter(d => d.r != null && d[metric] != null);
  const firstCmp  = validCmp[0];
  const lastCmp   = validCmp[validCmp.length - 1];
  const deltaRCmp = firstCmp && lastCmp ? lastCmp.r - firstCmp.r : null;
  const deltaHCmp = firstCmp && lastCmp ? lastCmp[metric] - firstCmp[metric] : null;

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
          <div className="fp-label">How light pollution &amp; mental health evolved together</div>
          <h2>Trajectory</h2>
          {country && !compareCountry && <div className="fp-country">{country}</div>}
          {country && compareCountry && (
            <div className="fp-compare-countries">
              <span className="fp-compare-country" style={{ fontSize: 14 }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_A }} />{country}
              </span>
              <span className="fp-vs">vs</span>
              <span className="fp-compare-country" style={{ fontSize: 14 }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_B }} />{compareCountry}
              </span>
            </div>
          )}
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
          {compareCountry ? (
            <div className="cmp-stat-pair">
              <div className="cmp-stat-row" style={{ color: COLOR_A }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_A }} />
                {fmtSigned(deltaR, v => d3.format('.2f')(Math.abs(v)))}
              </div>
              <div className="cmp-stat-row" style={{ color: COLOR_B }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_B }} />
                {fmtSigned(deltaRCmp, v => d3.format('.2f')(Math.abs(v)))}
              </div>
            </div>
          ) : (
            <div className="value" style={{ color: deltaR == null ? undefined : deltaR >= 0 ? 'var(--lgi)' : 'var(--lgr)' }}>
              {fmtSigned(deltaR, v => d3.format('.2f')(Math.abs(v)))}
            </div>
          )}
          <div className="unit">nW/cm²/sr</div>
        </div>

        <div className="stat">
          <div className="label">Δ {metricShort}</div>
          {compareCountry ? (
            <div className="cmp-stat-pair">
              <div className="cmp-stat-row" style={{ color: COLOR_A }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_A }} />
                {fmtSigned(deltaH, v => d3.format(',.0f')(Math.abs(v)))}
              </div>
              <div className="cmp-stat-row" style={{ color: COLOR_B }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_B }} />
                {fmtSigned(deltaHCmp, v => d3.format(',.0f')(Math.abs(v)))}
              </div>
            </div>
          ) : (
            <div className="value" style={{ color: 'var(--health)' }}>
              {fmtSigned(deltaH, v => d3.format(',.0f')(Math.abs(v)))}
            </div>
          )}
          <div className="unit">/100k</div>
        </div>
      </div>

      <div className="chart-title">
        {compareCountry
          ? 'Color: earlier → recent years · arrow shows direction'
          : <><span className="dot" style={{ background: 'var(--accent)' }} />Earlier years (purple) → recent years (yellow) · arrow shows direction</>
        }
      </div>

      {visible && (
        <TrajectoryChart
          series={series}
          compareSeries={compareSeries}
          year={year}
          healthMetric={metric}
          dark={dark}
          height={inStack ? null : (compact ? 150 : 220)}
        />
      )}

      {zoomed && (
        <ChartModal title="Trajectory" subtitle="How light pollution & mental health evolved together" country={country} meta={`${yearRange} · circle marks ${year}`} onClose={() => setZoomed(false)}>
          <TrajectoryChart series={series} compareSeries={compareSeries} year={year} healthMetric={metric} dark={dark} height={500} />
          {compareCountry && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--text-dim)' }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_A }} />{country}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--text-dim)' }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_B }} />{compareCountry}
              </span>
            </div>
          )}
        </ChartModal>
      )}
    </BorderGlow>
  );
}
