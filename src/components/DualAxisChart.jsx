import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function DualAxisChart({ series, year, dark, height = 240 }) {
  const ref = useRef(null);
  const d3Ref = useRef(null);

  // Build full SVG — only when data, theme, or size change.
  useEffect(() => {
    d3Ref.current = null;
    const el = ref.current;
    el.innerHTML = '';
    if (!series?.length) return;

    const W = el.clientWidth || 286;
    const H = height;
    const m = { top: 12, right: 42, bottom: 22, left: 42 };
    const iw = W - m.left - m.right;
    const ih = H - m.top - m.bottom;
    const ac = dark ? '#5b647d' : '#939bb2';
    const gc = dark ? '#2a3048' : '#e2e6ee';

    d3.select(el).style('position', 'relative');
    const svg = d3.select(el).append('svg').attr('width', W).attr('height', H);
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    const x = d3.scaleLinear().domain(d3.extent(series, d => d.year)).range([0, iw]);
    const yR = d3.scaleLinear().domain([0, (d3.max(series, d => d.r) || 1) * 1.1]).range([ih, 0]);
    const yG = d3.scaleLinear().domain([0, (d3.max(series, d => d.g) || 1) * 1.1]).range([ih, 0]);

    g.append('g')
      .attr('transform', `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('d')))
      .call(s => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));
    g.append('g')
      .call(d3.axisLeft(yR).ticks(4))
      .call(s => s.selectAll('text').attr('fill', 'var(--radiance)').style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));
    g.append('g')
      .attr('transform', `translate(${iw},0)`)
      .call(d3.axisRight(yG).ticks(4).tickFormat(d => d >= 1000 ? d3.format('.0s')(d) : d))
      .call(s => s.selectAll('text').attr('fill', 'var(--gdp)').style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));

    g.append('path').datum(series).attr('fill', 'none').attr('stroke', 'var(--radiance)').attr('stroke-width', 2)
      .attr('d', d3.line().x(d => x(d.year)).y(d => yR(d.r)).curve(d3.curveMonotoneX));
    g.append('path').datum(series).attr('fill', 'none').attr('stroke', 'var(--gdp)').attr('stroke-width', 2)
      .attr('d', d3.line().x(d => x(d.year)).y(d => yG(d.g)).curve(d3.curveMonotoneX));

    // Year marker group — positioned by the year effect.
    const markerG = g.append('g').attr('class', 'year-marker').style('display', 'none');
    const mLine = markerG.append('line').attr('y1', 0).attr('y2', ih)
      .attr('stroke', ac).attr('stroke-dasharray', '2,2').attr('opacity', 0.4);
    const mDotR = markerG.append('circle').attr('r', 4)
      .attr('fill', 'var(--radiance)').attr('stroke', 'var(--panel)').attr('stroke-width', 2);
    const mDotG = markerG.append('circle').attr('r', 4)
      .attr('fill', 'var(--gdp)').attr('stroke', 'var(--panel)').attr('stroke-width', 2);

    // Crosshair group.
    const crosshair = g.append('g').style('display', 'none').style('pointer-events', 'none');
    const vline = crosshair.append('line').attr('y1', 0).attr('y2', ih)
      .attr('stroke', ac).attr('stroke-width', 1).attr('stroke-dasharray', '3,2');
    const dotR = crosshair.append('circle').attr('r', 4)
      .attr('fill', 'var(--radiance)').attr('stroke', 'var(--panel)').attr('stroke-width', 2);
    const dotG = crosshair.append('circle').attr('r', 4)
      .attr('fill', 'var(--gdp)').attr('stroke', 'var(--panel)').attr('stroke-width', 2);

    const tip = d3.select(el).append('div').attr('class', 'chart-hover-tip').style('display', 'none');
    const bisect = d3.bisector(d => d.year).center;
    const fmtR = d3.format('.2f');
    const fmtG = v => v >= 1000 ? d3.format(',.0f')(v) : String(v);

    g.append('rect').attr('width', iw).attr('height', ih).attr('fill', 'none').attr('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mx] = d3.pointer(event);
        const idx = bisect(series, x.invert(mx));
        const d = series[Math.max(0, Math.min(idx, series.length - 1))];
        if (!d) return;
        const px = x(d.year);
        crosshair.style('display', null);
        vline.attr('x1', px).attr('x2', px);
        dotR.attr('cx', px).attr('cy', yR(d.r));
        dotG.attr('cx', px).attr('cy', yG(d.g));
        const tipX = px + m.left;
        const flipRight = tipX > W * 0.6;
        tip.style('display', 'block')
          .style('left', flipRight ? null : tipX + 10 + 'px')
          .style('right', flipRight ? W - tipX + 10 + 'px' : null)
          .style('top', m.top + 'px')
          .html(`<div class="tip-year">${d.year}</div>` +
            `<div class="tip-row"><span class="tip-dot" style="background:var(--radiance)"></span>${fmtR(d.r)} nW/cm²/sr</div>` +
            `<div class="tip-row"><span class="tip-dot" style="background:var(--gdp)"></span>$${fmtG(d.g)}</div>`);
      })
      .on('mouseleave', function() {
        crosshair.style('display', 'none');
        tip.style('display', 'none');
      });

    d3Ref.current = { x, yR, yG, ih, markerG, mLine, mDotR, mDotG };
  }, [series, dark, height]);

  // Update only the year marker — runs cheaply on every year change.
  useEffect(() => {
    const state = d3Ref.current;
    if (!state) return;
    const { x, yR, yG, ih, markerG, mLine, mDotR, mDotG } = state;
    const cy = series?.find(d => d.year === year);
    if (!cy) { markerG.style('display', 'none'); return; }
    markerG.style('display', null);
    mLine.attr('x1', x(cy.year)).attr('x2', x(cy.year));
    mDotR.attr('cx', x(cy.year)).attr('cy', yR(cy.r));
    mDotG.attr('cx', x(cy.year)).attr('cy', yG(cy.g));
  }, [year, series, dark, height]);

  return <div ref={ref} className="chart" />;
}
