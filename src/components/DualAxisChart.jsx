import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function DualAxisChart({ series, year, dark }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    el.innerHTML = '';
    if (!series || !series.length) return;

    const W = el.clientWidth || 286;
    const H = 190;
    const m = { top: 12, right: 42, bottom: 22, left: 42 };
    const iw = W - m.left - m.right;
    const ih = H - m.top - m.bottom;
    const ac = dark ? '#5b647d' : '#939bb2';
    const gc = dark ? '#2a3048' : '#e2e6ee';

    const svg = d3.select(el).append('svg').attr('width', W).attr('height', H);
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    const x = d3.scaleLinear().domain(d3.extent(series, (d) => d.year)).range([0, iw]);
    const yR = d3
      .scaleLinear()
      .domain([0, (d3.max(series, (d) => d.r) || 1) * 1.1])
      .range([ih, 0]);
    const yG = d3
      .scaleLinear()
      .domain([0, (d3.max(series, (d) => d.g) || 1) * 1.1])
      .range([ih, 0]);

    g.append('g')
      .attr('transform', `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('d')))
      .call((s) => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
      .call((s) => s.selectAll('line,path').attr('stroke', gc));
    g.append('g')
      .call(d3.axisLeft(yR).ticks(4))
      .call((s) => s.selectAll('text').attr('fill', 'var(--radiance)').style('font-size', '9px'))
      .call((s) => s.selectAll('line,path').attr('stroke', gc));
    g.append('g')
      .attr('transform', `translate(${iw},0)`)
      .call(d3.axisRight(yG).ticks(4).tickFormat((d) => (d >= 1000 ? d3.format('.0s')(d) : d)))
      .call((s) => s.selectAll('text').attr('fill', 'var(--gdp)').style('font-size', '9px'))
      .call((s) => s.selectAll('line,path').attr('stroke', gc));

    g.append('path')
      .datum(series)
      .attr('fill', 'none')
      .attr('stroke', 'var(--radiance)')
      .attr('stroke-width', 2)
      .attr('d', d3.line().x((d) => x(d.year)).y((d) => yR(d.r)).curve(d3.curveMonotoneX));
    g.append('path')
      .datum(series)
      .attr('fill', 'none')
      .attr('stroke', 'var(--gdp)')
      .attr('stroke-width', 2)
      .attr('d', d3.line().x((d) => x(d.year)).y((d) => yG(d.g)).curve(d3.curveMonotoneX));

    const cy = series.find((d) => d.year === year);
    if (cy) {
      g.append('line')
        .attr('x1', x(cy.year))
        .attr('x2', x(cy.year))
        .attr('y1', 0)
        .attr('y2', ih)
        .attr('stroke', ac)
        .attr('stroke-dasharray', '2,2')
        .attr('opacity', 0.4);
      g.append('circle')
        .attr('cx', x(cy.year))
        .attr('cy', yR(cy.r))
        .attr('r', 4)
        .attr('fill', 'var(--radiance)')
        .attr('stroke', 'var(--panel)')
        .attr('stroke-width', 2);
      g.append('circle')
        .attr('cx', x(cy.year))
        .attr('cy', yG(cy.g))
        .attr('r', 4)
        .attr('fill', 'var(--gdp)')
        .attr('stroke', 'var(--panel)')
        .attr('stroke-width', 2);
    }
  }, [series, year, dark]);

  return <div ref={ref} className="chart" />;
}
