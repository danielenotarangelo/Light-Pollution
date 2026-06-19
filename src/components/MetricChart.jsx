import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function MetricChart({ series, metricKey, year, color = '#10b981', dark, height, fmt }) {
  const ref = useRef(null);
  const d3Ref = useRef(null);

  useEffect(() => {
    d3Ref.current = null;
    const el = ref.current;
    el.innerHTML = '';
    const data = (series || []).filter(d => d[metricKey] != null);
    if (!data.length) return;

    const W  = el.clientWidth || 286;
    const H  = el.clientHeight || height || 160;
    const m  = { top: 12, right: 12, bottom: 22, left: 46 };
    const iw = W - m.left - m.right;
    const ih = H - m.top - m.bottom;
    const ac = dark ? '#5b647d' : '#939bb2';
    const gc = dark ? '#2a3048' : '#e2e6ee';

    d3.select(el).style('position', 'relative');
    const svg = d3.select(el).append('svg').attr('width', W).attr('height', H);
    const g   = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    const x   = d3.scaleBand().domain(data.map(d => d.year)).range([0, iw]).padding(0);
    const ext = d3.extent(data, d => d[metricKey]);
    const pad = (ext[1] - ext[0]) * 0.12 || 1;
    const y   = d3.scaleLinear().domain([Math.max(0, ext[0] - pad), ext[1] + pad]).range([ih, 0]);

    const xLine = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([0, iw]);

    // Area fill
    const area = d3.area()
      .x(d => xLine(d.year))
      .y0(ih)
      .y1(d => y(d[metricKey]))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', color)
      .attr('opacity', 0.12)
      .attr('d', area);

    // Line
    const line = d3.line()
      .x(d => xLine(d.year))
      .y(d => y(d[metricKey]))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('d', line);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${ih})`)
      .call(d3.axisBottom(x)
        .tickValues(data.filter((_, i) => i % 2 === 0).map(d => d.year))
        .tickFormat(d3.format('d')))
      .call(s => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));

    const fmtFn = fmt || (v => d3.format(',.0f')(v));
    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickFormat(fmtFn))
      .call(s => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));

    // Dots + tooltip
    const dots = g.selectAll('circle.dot').data(data).enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xLine(d.year))
      .attr('cy', d => y(d[metricKey]))
      .attr('r', 3)
      .attr('fill', color)
      .attr('opacity', 0.3);

    const tip = d3.select(el).append('div').attr('class', 'chart-hover-tip').style('display', 'none');

    g.append('rect')
      .attr('width', iw).attr('height', ih)
      .attr('fill', 'none').attr('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mx] = d3.pointer(event);
        const yr = Math.round(xLine.invert(mx));
        const d  = data.find(dd => dd.year === yr);
        if (!d) return;
        const cx = xLine(d.year);
        const flipRight = cx + m.left > W * 0.6;
        tip.style('display', 'block')
          .style('left',  flipRight ? null : cx + m.left + 8 + 'px')
          .style('right', flipRight ? W - cx - m.left + 8 + 'px' : null)
          .style('top', m.top + 'px')
          .html(`<div class="tip-year">${d.year}</div><div class="tip-row"><span class="tip-dot" style="background:${color}"></span>${fmtFn(d[metricKey])}</div>`);
      })
      .on('mouseleave', () => tip.style('display', 'none'));

    d3Ref.current = { dots, data };
  }, [series, metricKey, color, dark, height, fmt]);

  useEffect(() => {
    const state = d3Ref.current;
    if (!state) return;
    state.dots.attr('opacity', d => d.year === year ? 1 : 0.3)
              .attr('r',       d => d.year === year ? 4.5 : 3);
  }, [year, series, metricKey, dark]);

  return <div ref={ref} className="chart" style={height != null ? { height } : undefined} />;
}
