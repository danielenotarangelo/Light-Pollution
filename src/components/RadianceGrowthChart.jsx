import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const COLOR_A = '#f59e0b';
const COLOR_B = '#38bdf8';

export default function LGIChart({ series, compareSeries, year, dark, height }) {
  const ref = useRef(null);
  const d3Ref = useRef(null);

  useEffect(() => {
    d3Ref.current = null;
    const el = ref.current;
    el.innerHTML = '';
    if (!series?.length) return;

    const data = series.filter(d => d.lgi != null);
    if (!data.length) return;
    const cmpData = (compareSeries || []).filter(d => d.lgi != null);
    const isCompare = cmpData.length > 0;

    const W = el.clientWidth || 286;
    const H = el.clientHeight || height || 200;
    const m = { top: 12, right: 12, bottom: 22, left: 46 };
    const iw = W - m.left - m.right;
    const ih = H - m.top - m.bottom;
    const ac = dark ? '#5b647d' : '#939bb2';
    const gc = dark ? '#2a3048' : '#e2e6ee';

    d3.select(el).style('position', 'relative');
    const svg = d3.select(el).append('svg').attr('width', W).attr('height', H);
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    const x = d3.scaleBand().domain(data.map(d => d.year)).range([0, iw]).padding(isCompare ? 0.25 : 0.2);
    const allAbs = [...data, ...cmpData].map(d => Math.abs(d.lgi));
    const maxAbs = d3.max(allAbs) || 0.1;
    const y = d3.scaleLinear().domain([-maxAbs * 1.25, maxAbs * 1.25]).range([ih, 0]);

    // Sub-band for grouped bars
    const xSub = isCompare
      ? d3.scaleBand().domain(['a', 'b']).range([0, x.bandwidth()]).padding(0.08)
      : null;

    g.append('g')
      .attr('transform', `translate(0,${ih})`)
      .call(d3.axisBottom(x)
        .tickValues(data.filter((_, i) => i % 2 === 0).map(d => d.year))
        .tickFormat(d3.format('d')))
      .call(s => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));
    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickFormat(v => (v >= 0 ? '+' : '') + d3.format('.0%')(v)))
      .call(s => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));

    g.append('line').attr('x1', 0).attr('x2', iw).attr('y1', y(0)).attr('y2', y(0))
      .attr('stroke', gc).attr('stroke-width', 1).attr('stroke-dasharray', '3,2');

    const barX    = (d) => isCompare ? x(d.year) + xSub('a') : x(d.year);
    const barW    = ()  => isCompare ? xSub.bandwidth() : x.bandwidth();
    const barFill = (d) => isCompare ? COLOR_A : (d.lgi >= 0 ? 'var(--lgi)' : 'var(--lgr)');

    const bars = g.selectAll('rect.bar').data(data).enter().append('rect')
      .attr('class', 'bar')
      .attr('x', barX)
      .attr('width', barW())
      .attr('y', d => d.lgi >= 0 ? y(d.lgi) : y(0))
      .attr('height', d => Math.max(1, Math.abs(y(d.lgi) - y(0))))
      .attr('fill', barFill)
      .attr('opacity', isCompare ? (d => d.lgi >= 0 ? 0.85 : 0.4) : 0.4)
      .attr('rx', 2);

    let barsB = null;
    if (isCompare) {
      barsB = g.selectAll('rect.bar-b').data(cmpData).enter().append('rect')
        .attr('class', 'bar-b')
        .attr('x', d => x(d.year) + xSub('b'))
        .attr('width', xSub.bandwidth())
        .attr('y', d => d.lgi >= 0 ? y(d.lgi) : y(0))
        .attr('height', d => Math.max(1, Math.abs(y(d.lgi) - y(0))))
        .attr('fill', COLOR_B)
        .attr('opacity', d => d.lgi >= 0 ? 0.85 : 0.4)
        .attr('rx', 2);
    }

    const tip = d3.select(el).append('div').attr('class', 'chart-hover-tip').style('display', 'none');

    g.append('rect').attr('width', iw).attr('height', ih).attr('fill', 'none').attr('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mx] = d3.pointer(event);
        const hovYear = x.domain().find(yr => { const bx = x(yr); return mx >= bx && mx <= bx + x.bandwidth(); });
        if (!hovYear) return;
        const d = data.find(dd => dd.year === hovYear);
        if (!d) return;
        const label = v => Math.abs(v) < 1e-6 ? '—' : (v >= 0 ? '+' : '') + (v * 100).toFixed(2) + '%';
        const px = x(hovYear) + x.bandwidth() / 2;
        const flipRight = px + m.left > W * 0.6;
        let html = `<div class="tip-year">${hovYear}</div>
          <div class="tip-row"><span class="tip-dot" style="background:${COLOR_A}"></span>${label(d.lgi)}</div>`;
        if (isCompare) {
          const dc = cmpData.find(dd => dd.year === hovYear);
          if (dc) html += `<div class="tip-row"><span class="tip-dot" style="background:${COLOR_B}"></span>${label(dc.lgi)}</div>`;
        }
        tip.style('display', 'block')
          .style('left', flipRight ? null : px + m.left + 8 + 'px')
          .style('right', flipRight ? W - px - m.left + 8 + 'px' : null)
          .style('top', m.top + 'px')
          .html(html);
      })
      .on('mouseleave', () => tip.style('display', 'none'));

    d3Ref.current = { bars, barsB, data, cmpData, isCompare };
  }, [series, compareSeries, dark, height]);

  // Highlight current year bar(s)
  useEffect(() => {
    const state = d3Ref.current;
    if (!state) return;
    const { bars, barsB, data, cmpData, isCompare } = state;
    if (isCompare) {
      bars.attr('opacity', d => d.year === year ? 1 : (d.lgi >= 0 ? 0.5 : 0.2));
      barsB?.attr('opacity', d => d.year === year ? 1 : (d.lgi >= 0 ? 0.5 : 0.2));
    } else {
      bars.attr('opacity', d => d.year === year ? 1 : 0.4);
    }
  }, [year, series, compareSeries, dark, height]);

  return <div ref={ref} className="chart" style={height != null ? { height } : undefined} />;
}
