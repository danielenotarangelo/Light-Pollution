import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function TrajectoryChart({ series, year, healthMetric, dark, height }) {
  const ref = useRef(null);
  const d3Ref = useRef(null);

  // Static effect: build the full chart
  useEffect(() => {
    d3Ref.current = null;
    const el = ref.current;
    el.innerHTML = '';
    if (!series?.length) return;

    const data = series
      .filter(d => d.r != null && d[healthMetric] != null)
      .sort((a, b) => a.year - b.year);
    if (data.length < 2) return;

    const W = el.clientWidth || 286;
    const H = el.clientHeight || height || 220;
    const m = { top: 16, right: 14, bottom: 36, left: 44 };
    const iw = W - m.left - m.right;
    const ih = H - m.top - m.bottom;
    const ac = dark ? '#5b647d' : '#939bb2';
    const gc = dark ? '#2a3048' : '#e2e6ee';
    const bg = dark ? '#0d101c' : '#f8f9fc';

    const minR = d3.min(data, d => d.r);
    const maxR = d3.max(data, d => d.r);
    const minH = d3.min(data, d => d[healthMetric]);
    const maxH = d3.max(data, d => d[healthMetric]);

    // Use log scale if radiance spans more than 3× — otherwise linear avoids axis label clutter
    const useLog = maxR / (minR || 0.01) > 3;
    const x = useLog
      ? d3.scaleLog().domain([minR * 0.65, maxR * 1.5]).range([0, iw]).clamp(true)
      : d3.scaleLinear().domain([minR * 0.85, maxR * 1.15]).range([0, iw]);
    const y = d3.scaleLinear()
      .domain([minH * 0.95, maxH * 1.05])
      .range([ih, 0]);

    // Year → color: plasma from purple (2013) to yellow (2023)
    const colorScale = d3.scaleSequential(d3.interpolatePlasma).domain([2013, 2025]);

    d3.select(el).style('position', 'relative');
    const svg = d3.select(el).append('svg').attr('width', W).attr('height', H);
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    // Arrowhead marker (colored like the most recent year)
    const arrowColor = colorScale(data[data.length - 1].year);
    svg.append('defs').append('marker')
      .attr('id', 'traj-arrow')
      .attr('viewBox', '0 -4 9 8')
      .attr('refX', 7).attr('refY', 0)
      .attr('markerWidth', 5).attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L9,0L0,4Z')
      .attr('fill', arrowColor);

    // Axes
    g.append('g').attr('transform', `translate(0,${ih})`)
      .call((useLog ? d3.axisBottom(x).ticks(4, '~s') : d3.axisBottom(x).ticks(4)))
      .call(s => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));
    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickFormat(d3.format('~s')))
      .call(s => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));
    g.append('text')
      .attr('x', iw / 2).attr('y', ih + 30)
      .attr('text-anchor', 'middle').attr('fill', ac).style('font-size', '9px')
      .text('mean radiance →');

    // Trajectory line with arrowhead at end
    g.append('path').datum(data)
      .attr('fill', 'none')
      .attr('stroke', dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)')
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#traj-arrow)')
      .attr('d', d3.line().x(d => x(d.r)).y(d => y(d[healthMetric])));

    // Dots — colored by year, larger for first and last
    const isEndpoint = d => d === data[0] || d === data[data.length - 1];
    g.selectAll('circle.yd').data(data).enter().append('circle')
      .attr('class', 'yd')
      .attr('cx', d => x(d.r))
      .attr('cy', d => y(d[healthMetric]))
      .attr('r', d => isEndpoint(d) ? 5.5 : 3.5)
      .attr('fill', d => colorScale(d.year))
      .attr('stroke', bg)
      .attr('stroke-width', 1.5);

    // Year labels for first and last only
    [data[0], data[data.length - 1]].forEach(d => {
      const px = x(d.r), py = y(d[healthMetric]);
      const anchorRight = px > iw * 0.75;
      const above = py < ih * 0.25;
      g.append('text')
        .attr('x', anchorRight ? px - 8 : px + 8)
        .attr('y', above ? py + 14 : py - 8)
        .attr('text-anchor', anchorRight ? 'end' : 'start')
        .attr('fill', colorScale(d.year))
        .style('font-size', '9px').style('font-weight', '700')
        .text(d.year);
    });

    // Year-highlight ring (updated by the year effect)
    const highlight = g.append('circle').attr('r', 8)
      .attr('fill', 'none')
      .attr('stroke', 'var(--accent)')
      .attr('stroke-width', 2)
      .style('display', 'none');

    // Hover tooltip
    const tip = d3.select(el).append('div').attr('class', 'chart-hover-tip').style('display', 'none');

    g.selectAll('circle.yd')
      .on('mouseover', function(event, d) {
        const tipX = x(d.r) + m.left;
        const flipRight = tipX > W * 0.6;
        tip.style('display', 'block')
          .style('left', flipRight ? null : tipX + 10 + 'px')
          .style('right', flipRight ? W - tipX + 10 + 'px' : null)
          .style('top', (y(d[healthMetric]) + m.top) + 'px')
          .html(`<div class="tip-year">${d.year}</div>
            <div class="tip-row"><span class="tip-dot" style="background:${colorScale(d.year)}"></span>${d3.format('.2f')(d.r)} nW/cm²/sr</div>
            <div class="tip-row"><span class="tip-dot" style="background:var(--health)"></span>${d3.format(',.0f')(d[healthMetric])}/100k</div>`);
      })
      .on('mouseleave', () => tip.style('display', 'none'));

    d3Ref.current = { x, y, data, highlight, hKey: healthMetric };
  }, [series, healthMetric, dark, height]);

  // Year effect: move the ring to the selected year's dot
  useEffect(() => {
    const state = d3Ref.current;
    if (!state) return;
    const { x, y, data, highlight, hKey } = state;
    const pt = data.find(d => d.year === year);
    if (!pt) { highlight.style('display', 'none'); return; }
    highlight.style('display', null)
      .attr('cx', x(pt.r))
      .attr('cy', y(pt[hKey]));
  }, [year, series, healthMetric, dark, height]);

  return <div ref={ref} className="chart" style={height != null ? { height } : undefined} />;
}
