import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const ROW_H   = 30;
const MARGIN  = { top: 8, right: 72, bottom: 24, left: 130 };
const TOP_N   = 10;

export const RANK_METRICS = [
  { key: 'r',   label: 'Radiance',  unit: 'nW/cm²/sr', fmt: v => d3.format('.2f')(v) },
  { key: 'lgi', label: 'Growth',    unit: '% vs 2013',  fmt: v => (v >= 0 ? '+' : '') + d3.format('.1f')(v) + '%' },
  { key: 'e',   label: 'Energy',    unit: 'kWh/cap',    fmt: v => d3.format(',.0f')(v) },
  { key: 'u',   label: 'Urban',     unit: '% of pop.',  fmt: v => d3.format('.1f')(v) + '%' },
];

function getTopN(lookup, year, metricKey) {
  const rows = [];
  for (const [country, yrs] of Object.entries(lookup)) {
    const entry = yrs[year];
    const val = entry?.[metricKey];
    if (val == null) continue;
    rows.push({ country, value: val });
  }
  rows.sort((a, b) => b.value - a.value);
  return rows.slice(0, TOP_N).map((d, i) => ({ ...d, rank: i }));
}

export default function RankingChart({ lookup, year, dark, country: selected, metric, onSelect }) {
  const svgRef  = useRef(null);
  const stateRef = useRef(null);

  const ac = dark ? '#5b647d' : '#939bb2';
  const gc = dark ? '#2a3048' : '#e2e6ee';

  // Build the static SVG skeleton once
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.innerHTML = '';

    const W  = el.clientWidth  || 320;
    const H  = ROW_H * TOP_N + MARGIN.top + MARGIN.bottom;
    const iw = W - MARGIN.left - MARGIN.right;

    el.setAttribute('viewBox', `0 0 ${W} ${H}`);
    el.setAttribute('width',  W);
    el.setAttribute('height', H);

    const root = d3.select(el);
    const g    = root.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // x-axis placeholder — updated in the data effect
    g.append('g').attr('class', 'x-axis').attr('transform', `translate(0,${TOP_N * ROW_H})`);

    // bars group
    g.append('g').attr('class', 'bars');

    stateRef.current = { g, iw, W };
  }, [dark]);

  // Update bars on every year / metric / selection change
  useEffect(() => {
    const state = stateRef.current;
    if (!state || !lookup) return;
    const { g, iw } = state;

    const meta = RANK_METRICS.find(m => m.key === metric) || RANK_METRICS[0];
    const data = getTopN(lookup, year, metric);
    if (!data.length) return;

    const maxVal = data[0].value;
    const x = d3.scaleLinear().domain([0, maxVal * 1.05]).range([0, iw]);

    // Update x-axis
    g.select('.x-axis')
      .transition().duration(600)
      .call(
        d3.axisBottom(x).ticks(4).tickFormat(meta.fmt)
      )
      .call(s => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));

    // Keyed join on country name
    const barsG = g.select('.bars');
    const join = barsG.selectAll('g.bar-row').data(data, d => d.country);

    // ENTER
    const enter = join.enter()
      .append('g').attr('class', 'bar-row')
      .attr('transform', d => `translate(0,${d.rank * ROW_H})`)
      .attr('opacity', 0)
      .style('cursor', onSelect ? 'pointer' : 'default')
      .on('click', (_, d) => onSelect && onSelect(d.country));

    enter.append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', 4)
      .attr('height', ROW_H - 8)
      .attr('rx', 3)
      .attr('width', d => Math.max(2, x(d.value)));

    enter.append('text')
      .attr('class', 'lbl-country')
      .attr('x', -6)
      .attr('y', ROW_H / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .style('font-size', '11px')
      .style('font-family', 'inherit')
      .text(d => d.country.length > 18 ? d.country.slice(0, 17) + '…' : d.country);

    enter.append('text')
      .attr('class', 'lbl-val')
      .attr('y', ROW_H / 2)
      .attr('dy', '0.35em')
      .style('font-size', '10px')
      .style('font-family', 'inherit')
      .style('font-weight', '600');

    // UPDATE + ENTER merged
    const merged = join.merge(enter);

    merged.transition().duration(700).ease(d3.easeCubicInOut)
      .attr('transform', d => `translate(0,${d.rank * ROW_H})`)
      .attr('opacity', 1);

    const metricColor = { r: '#f59e0b', lgi: 'var(--lgi)', e: '#10b981', u: '#06b6d4' };
    const barColor = metricColor[metric] || 'var(--lgi)';

    merged.select('rect.bar')
      .transition().duration(700).ease(d3.easeCubicInOut)
      .attr('width', d => Math.max(2, x(d.value)))
      .attr('fill', d => d.country === selected ? 'var(--lgr)' : barColor);

    merged.select('text.lbl-country')
      .attr('fill', d => d.country === selected ? 'var(--lgr)' : (dark ? '#c8d0e8' : '#1e2540'))
      .style('font-weight', d => d.country === selected ? '700' : '400')
      .text(d => d.country.length > 18 ? d.country.slice(0, 17) + '…' : d.country);

    merged.select('text.lbl-val')
      .transition().duration(700).ease(d3.easeCubicInOut)
      .attr('x', d => Math.max(2, x(d.value)) + 5)
      .attr('fill', d => d.country === selected ? 'var(--lgr)' : ac)
      .text(d => meta.fmt(d.value));

    // EXIT
    join.exit()
      .transition().duration(400)
      .attr('opacity', 0)
      .remove();

  }, [lookup, year, metric, selected, dark]);

  return (
    <svg
      ref={svgRef}
      style={{ width: '100%', overflow: 'visible', display: 'block' }}
    />
  );
}
