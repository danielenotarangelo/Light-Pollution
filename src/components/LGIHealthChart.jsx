import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function LGIHealthChart({ series, year, healthMetric, dark, height = 200 }) {
  const ref = useRef(null);
  const d3Ref = useRef(null);

  useEffect(() => {
    d3Ref.current = null;
    const el = ref.current;
    el.innerHTML = '';
    if (!series?.length) return;

    const data = series.filter(d => d.lgi != null && d[healthMetric] != null);
    if (!data.length) return;

    const W = el.clientWidth || 286;
    const H = height;
    const m = { top: 12, right: 46, bottom: 22, left: 46 };
    const iw = W - m.left - m.right;
    const ih = H - m.top - m.bottom;
    const ac = dark ? '#5b647d' : '#939bb2';
    const gc = dark ? '#2a3048' : '#e2e6ee';
    const bg = dark ? '#0d101c' : '#f8f9fc';

    d3.select(el).style('position', 'relative');
    const svg = d3.select(el).append('svg').attr('width', W).attr('height', H);
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    const x = d3.scaleBand().domain(data.map(d => d.year)).range([0, iw]).padding(0.2);
    const maxAbsLGI = d3.max(data, d => Math.abs(d.lgi)) || 0.1;
    const yL = d3.scaleLinear().domain([-maxAbsLGI * 1.25, maxAbsLGI * 1.25]).range([ih, 0]);
    const hExt = d3.extent(data, d => d[healthMetric]);
    const hPad = (hExt[1] - hExt[0]) * 0.25 || 50;
    const yH = d3.scaleLinear().domain([hExt[0] - hPad, hExt[1] + hPad]).range([ih, 0]);

    g.append('g').attr('transform', `translate(0,${ih})`)
      .call(d3.axisBottom(x)
        .tickValues(data.filter((_, i) => i % 2 === 0).map(d => d.year))
        .tickFormat(d3.format('d')))
      .call(s => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));
    g.append('g')
      .call(d3.axisLeft(yL).ticks(4).tickFormat(v => (v >= 0 ? '+' : '') + d3.format('.0%')(v)))
      .call(s => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));
    g.append('g').attr('transform', `translate(${iw},0)`)
      .call(d3.axisRight(yH).ticks(4).tickFormat(d3.format(',.0f')))
      .call(s => s.selectAll('text').attr('fill', 'var(--health)').style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));

    // Zero line for LGI
    g.append('line')
      .attr('x1', 0).attr('x2', iw).attr('y1', yL(0)).attr('y2', yL(0))
      .attr('stroke', gc).attr('stroke-width', 1).attr('stroke-dasharray', '3,2');

    // LGI bars — highlighted by year effect
    const bars = g.selectAll('rect.bar').data(data).enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.year))
      .attr('width', x.bandwidth())
      .attr('y', d => d.lgi >= 0 ? yL(d.lgi) : yL(0))
      .attr('height', d => Math.max(1, Math.abs(yL(d.lgi) - yL(0))))
      .attr('fill', d => d.lgi >= 0 ? 'var(--lgi)' : 'var(--lgr)')
      .attr('opacity', 0.4)
      .attr('rx', 2);

    // Health metric line (static — all years)
    g.append('path').datum(data)
      .attr('fill', 'none').attr('stroke', 'var(--health)').attr('stroke-width', 2)
      .attr('d', d3.line()
        .x(d => x(d.year) + x.bandwidth() / 2)
        .y(d => yH(d[healthMetric]))
        .curve(d3.curveMonotoneX));

    // Year marker: vertical line + dot on health line
    const markerG = g.append('g').style('display', 'none');
    const mLine = markerG.append('line').attr('y1', 0).attr('y2', ih)
      .attr('stroke', ac).attr('stroke-dasharray', '2,2').attr('opacity', 0.4);
    const mDot = markerG.append('circle').attr('r', 4)
      .attr('fill', 'var(--health)').attr('stroke', bg).attr('stroke-width', 2);

    const tip = d3.select(el).append('div').attr('class', 'chart-hover-tip').style('display', 'none');

    g.append('rect').attr('width', iw).attr('height', ih).attr('fill', 'none').attr('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mx] = d3.pointer(event);
        const hovYear = data.reduce((a, b) => {
          const da = Math.abs(x(a.year) + x.bandwidth() / 2 - mx);
          const db = Math.abs(x(b.year) + x.bandwidth() / 2 - mx);
          return db < da ? b : a;
        }).year;
        const d = data.find(dd => dd.year === hovYear);
        if (!d) return;
        const lgiColor = d.lgi >= 0 ? 'var(--lgi)' : 'var(--lgr)';
        const lgiLabel = Math.abs(d.lgi) < 1e-6 ? '—' : (d.lgi >= 0 ? '+' : '') + (d.lgi * 100).toFixed(1) + '%';
        const px = x(hovYear) + x.bandwidth() / 2 + m.left;
        const flipRight = px > W * 0.6;
        tip.style('display', 'block')
          .style('left', flipRight ? null : px + 8 + 'px')
          .style('right', flipRight ? W - px + 8 + 'px' : null)
          .style('top', m.top + 'px')
          .html(`<div class="tip-year">${hovYear}</div>
            <div class="tip-row"><span class="tip-dot" style="background:${lgiColor}"></span>${lgiLabel}</div>
            <div class="tip-row"><span class="tip-dot" style="background:var(--health)"></span>${d3.format(',.0f')(d[healthMetric])}/100k</div>`);
      })
      .on('mouseleave', () => tip.style('display', 'none'));

    d3Ref.current = { bars, data, x, yH, markerG, mLine, mDot, hKey: healthMetric };
  }, [series, healthMetric, dark, height]);

  useEffect(() => {
    const state = d3Ref.current;
    if (!state) return;
    const { bars, data, x, yH, markerG, mLine, mDot, hKey } = state;
    bars.attr('opacity', d => d.year === year ? 1 : 0.4);
    const cy = data.find(d => d.year === year);
    if (!cy) { markerG.style('display', 'none'); return; }
    markerG.style('display', null);
    const cx = x(cy.year) + x.bandwidth() / 2;
    mLine.attr('x1', cx).attr('x2', cx);
    mDot.attr('cx', cx).attr('cy', yH(cy[hKey]));
  }, [year, series, healthMetric, dark, height]);

  return <div ref={ref} className="chart" />;
}
