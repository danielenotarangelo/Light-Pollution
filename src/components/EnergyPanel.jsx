import { useState } from 'react';
import * as d3 from 'd3';
import BorderGlow from './BorderGlow.jsx';
import MetricChart from './MetricChart.jsx';
import ChartModal from './ChartModal.jsx';
import { getSeries } from '../lib/data.js';
import { YEARS } from '../lib/constants.js';

const fmtEnergy = v => v == null ? '—' : d3.format(',.0f')(v) + ' kWh';
const fmtUrban  = v => v == null ? '—' : d3.format('.1f')(v) + '%';

export default function EnergyPanel({ lookup, country, year, dark, inStack = false }) {
  const [zoomedEnergy, setZoomedEnergy] = useState(false);
  const [zoomedUrban,  setZoomedUrban]  = useState(false);

  const series  = country ? getSeries(lookup, YEARS, country) : [];
  const cur     = country && lookup[country] ? lookup[country][year] : null;
  const bg      = dark ? 'rgba(13, 16, 28, 0.85)' : 'rgba(248, 249, 252, 0.90)';

  const energyVal = cur?.e ?? null;
  const urbanVal  = cur?.u ?? null;

  return (
    <BorderGlow
      className={inStack ? 'panel-stack-card' : 'float-panel visible'}
      backgroundColor={bg}
      borderRadius={22}
      glowRadius={5}
      glowIntensity={0.06}
      glowColor="16 185 129"
      edgeSensitivity={60}
      coneSpread={10}
      fillOpacity={0.01}
      colors={['#10b981', '#06b6d4', '#3b82f6']}
    >
      <div className="fp-head">
        <div>
          <div className="fp-label">Energy & Urbanization</div>
          <h2>Environment</h2>
          {country && <div className="fp-country">{country}</div>}
          <div className="meta">{year}</div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="label">Energy use</div>
          <div className="value" style={{ color: '#10b981' }}>{fmtEnergy(energyVal)}</div>
          <div className="unit">per capita</div>
        </div>
        <div className="stat">
          <div className="label">Urban pop.</div>
          <div className="value" style={{ color: '#06b6d4' }}>{fmtUrban(urbanVal)}</div>
          <div className="unit">% of total</div>
        </div>
      </div>

      {/* Energy chart */}
      <div className="chart-title">
        <span className="dot" style={{ background: '#10b981' }} />
        Electric power consumption (kWh/capita)
        {country && (
          <button className="zoom-btn" onClick={e => { e.stopPropagation(); setZoomedEnergy(true); }} title="Expand chart">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </button>
        )}
      </div>
      {country && (
        <MetricChart
          series={series}
          metricKey="e"
          year={year}
          color="#10b981"
          dark={dark}
          height={130}
          fmt={v => d3.format(',.0f')(v)}
        />
      )}

      {/* Urbanization chart */}
      <div className="chart-title" style={{ marginTop: 10 }}>
        <span className="dot" style={{ background: '#06b6d4' }} />
        Urban population (% of total)
        {country && (
          <button className="zoom-btn" onClick={e => { e.stopPropagation(); setZoomedUrban(true); }} title="Expand chart">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </button>
        )}
      </div>
      {country && (
        <MetricChart
          series={series}
          metricKey="u"
          year={year}
          color="#06b6d4"
          dark={dark}
          height={130}
          fmt={v => d3.format('.1f')(v) + '%'}
        />
      )}

      {zoomedEnergy && (
        <ChartModal title="Energy Consumption" subtitle="Electric power consumption (kWh per capita)" country={country} meta={String(year)} onClose={() => setZoomedEnergy(false)}>
          <MetricChart series={series} metricKey="e" year={year} color="#10b981" dark={dark} height={340} fmt={v => d3.format(',.0f')(v)} />
        </ChartModal>
      )}
      {zoomedUrban && (
        <ChartModal title="Urbanization Rate" subtitle="Urban population as % of total" country={country} meta={String(year)} onClose={() => setZoomedUrban(false)}>
          <MetricChart series={series} metricKey="u" year={year} color="#06b6d4" dark={dark} height={340} fmt={v => d3.format('.1f')(v) + '%'} />
        </ChartModal>
      )}
    </BorderGlow>
  );
}
