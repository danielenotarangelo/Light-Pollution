import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function ScatterChart({ lookup, year, selected, dark }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    el.innerHTML = '';

    const W = el.clientWidth || 286;
    const H = 260;
    const m = { top: 12, right: 12, bottom: 38, left: 42 };
    const iw = W - m.left - m.right;
    const ih = H - m.top - m.bottom;
    const ac = dark ? '#5b647d' : '#939bb2';
    const gc = dark ? '#2a3048' : '#e2e6ee';

    const pts = [];
    for (const c in lookup) {
      const y = lookup[c][year];
      if (y && y.r != null && y.d != null) pts.push({ country: c, r: y.r, d: y.d });
    }
    if (!pts.length) return;

    const svg = d3.select(el).append('svg').attr('width', W).attr('height', H);
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    const x = d3
      .scaleLog()
      .domain([0.03, (d3.max(pts, (d) => d.r) || 1) * 1.2])
      .range([0, iw])
      .clamp(true);
    const y = d3
      .scaleLinear()
      .domain([(d3.min(pts, (d) => d.d) || 0) * 0.9, (d3.max(pts, (d) => d.d) || 1) * 1.05])
      .range([ih, 0]);

    g.append('g')
      .attr('transform', `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(4, '~s'))
      .call((s) => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
      .call((s) => s.selectAll('line,path').attr('stroke', gc));
    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('~s')))
      .call((s) => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
      .call((s) => s.selectAll('line,path').attr('stroke', gc));
    g.append('text')
      .attr('x', iw / 2)
      .attr('y', ih + 30)
      .attr('text-anchor', 'middle')
      .attr('fill', ac)
      .style('font-size', '9px')
      .text('radiance (log) →');

    g.selectAll('circle.pt')
      .data(pts)
      .enter()
      .append('circle')
      .attr('class', 'pt')
      .attr('cx', (d) => x(d.r))
      .attr('cy', (d) => y(d.d))
      .attr('r', (d) => (d.country === selected ? 6 : 3))
      .attr('fill', (d) => (d.country === selected ? 'var(--accent)' : 'var(--health)'))
      .attr('opacity', (d) => (d.country === selected ? 1 : 0.3))
      .attr('stroke', (d) => (d.country === selected ? 'var(--panel)' : 'none'))
      .attr('stroke-width', 2);

    const sel = pts.find((d) => d.country === selected);
    if (sel) {
      g.append('text')
        .attr('x', x(sel.r) + 9)
        .attr('y', y(sel.d) + 3)
        .attr('fill', 'var(--accent)')
        .style('font-size', '11px')
        .style('font-weight', '600')
        .text(sel.country);
    }
  }, [lookup, year, selected, dark]);

  return <div ref={ref} className="chart" />;
}
