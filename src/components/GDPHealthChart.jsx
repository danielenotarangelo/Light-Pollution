import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function GDPHealthChart({ series, year, healthMetric, dark, height = 200 }) {
  const ref = useRef(null);
  const d3Ref = useRef(null);

  useEffect(() => {
    d3Ref.current = null;
    const el = ref.current;
    el.innerHTML = '';
    if (!series?.length) return;

    const data = series.filter(d => d.g != null && d[healthMetric] != null);
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

    const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([0, iw]);
    const yG = d3.scaleLinear().domain([0, (d3.max(data, d => d.g) || 1) * 1.1]).range([ih, 0]);
    const hExt = d3.extent(data, d => d[healthMetric]);
    const hPad = (hExt[1] - hExt[0]) * 0.25 || 50;
    const yH = d3.scaleLinear().domain([hExt[0] - hPad, hExt[1] + hPad]).range([ih, 0]);

    g.append('g').attr('transform', `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('d')))
      .call(s => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));
    g.append('g')
      .call(d3.axisLeft(yG).ticks(4).tickFormat(v => v >= 1000 ? d3.format('$.0s')(v) : '$' + v))
      .call(s => s.selectAll('text').attr('fill', 'var(--gdp)').style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));
    g.append('g').attr('transform', `translate(${iw},0)`)
      .call(d3.axisRight(yH).ticks(4).tickFormat(d3.format(',.0f')))
      .call(s => s.selectAll('text').attr('fill', 'var(--health)').style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));

    // GDP line
    g.append('path').datum(data)
      .attr('fill', 'none').attr('stroke', 'var(--gdp)').attr('stroke-width', 2)
      .attr('d', d3.line().x(d => x(d.year)).y(d => yG(d.g)).curve(d3.curveMonotoneX));

    // Health metric line
    g.append('path').datum(data)
      .attr('fill', 'none').attr('stroke', 'var(--health)').attr('stroke-width', 2)
      .attr('d', d3.line().x(d => x(d.year)).y(d => yH(d[healthMetric])).curve(d3.curveMonotoneX));

    // Year marker group
    const markerG = g.append('g').style('display', 'none');
    const mLine = markerG.append('line').attr('y1', 0).attr('y2', ih)
      .attr('stroke', ac).attr('stroke-dasharray', '2,2').attr('opacity', 0.4);
    const mDotG = markerG.append('circle').attr('r', 4)
      .attr('fill', 'var(--gdp)').attr('stroke', bg).attr('stroke-width', 2);
    const mDotH = markerG.append('circle').attr('r', 4)
      .attr('fill', 'var(--health)').attr('stroke', bg).attr('stroke-width', 2);

    // Crosshair + tooltip (same pattern as DualAxisChart)
    const crosshair = g.append('g').style('display', 'none').style('pointer-events', 'none');
    const vline = crosshair.append('line').attr('y1', 0).attr('y2', ih)
      .attr('stroke', ac).attr('stroke-width', 1).attr('stroke-dasharray', '3,2');
    const dotG = crosshair.append('circle').attr('r', 4)
      .attr('fill', 'var(--gdp)').attr('stroke', bg).attr('stroke-width', 2);
    const dotH = crosshair.append('circle').attr('r', 4)
      .attr('fill', 'var(--health)').attr('stroke', bg).attr('stroke-width', 2);

    const tip = d3.select(el).append('div').attr('class', 'chart-hover-tip').style('display', 'none');
    const bisect = d3.bisector(d => d.year).center;

    g.append('rect').attr('width', iw).attr('height', ih).attr('fill', 'none').attr('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mx] = d3.pointer(event);
        const idx = bisect(data, x.invert(mx));
        const d = data[Math.max(0, Math.min(idx, data.length - 1))];
        if (!d) return;
        const px = x(d.year);
        crosshair.style('display', null);
        vline.attr('x1', px).attr('x2', px);
        dotG.attr('cx', px).attr('cy', yG(d.g));
        dotH.attr('cx', px).attr('cy', yH(d[healthMetric]));
        const tipX = px + m.left;
        const flipRight = tipX > W * 0.6;
        tip.style('display', 'block')
          .style('left', flipRight ? null : tipX + 10 + 'px')
          .style('right', flipRight ? W - tipX + 10 + 'px' : null)
          .style('top', m.top + 'px')
          .html(`<div class="tip-year">${d.year}</div>
            <div class="tip-row"><span class="tip-dot" style="background:var(--gdp)"></span>${d3.format('$,.0f')(d.g)}</div>
            <div class="tip-row"><span class="tip-dot" style="background:var(--health)"></span>${d3.format(',.0f')(d[healthMetric])}/100k</div>`);
      })
      .on('mouseleave', function() {
        crosshair.style('display', 'none');
        tip.style('display', 'none');
      });

    d3Ref.current = { x, yG, yH, markerG, mLine, mDotG, mDotH, data, hKey: healthMetric };
  }, [series, healthMetric, dark, height]);

  useEffect(() => {
    const state = d3Ref.current;
    if (!state) return;
    const { x, yG, yH, markerG, mLine, mDotG, mDotH, data, hKey } = state;
    const cy = data.find(d => d.year === year);
    if (!cy) { markerG.style('display', 'none'); return; }
    markerG.style('display', null);
    mLine.attr('x1', x(cy.year)).attr('x2', x(cy.year));
    mDotG.attr('cx', x(cy.year)).attr('cy', yG(cy.g));
    mDotH.attr('cx', x(cy.year)).attr('cy', yH(cy[hKey]));
  }, [year, series, healthMetric, dark, height]);

  return <div ref={ref} className="chart" />;
}
