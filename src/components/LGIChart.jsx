import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function LGIChart({ series, year, dark, height }) {
  const ref = useRef(null);
  const d3Ref = useRef(null);

  // Build full SVG — only when data, theme, or size change.
  useEffect(() => {
    d3Ref.current = null;
    const el = ref.current;
    el.innerHTML = '';
    if (!series?.length) return;

    const data = series.filter(d => d.lgi != null);
    if (!data.length) return;

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

    const x = d3.scaleBand().domain(data.map(d => d.year)).range([0, iw]).padding(0.2);
    const maxAbs = d3.max(data, d => Math.abs(d.lgi)) || 0.1;
    const y = d3.scaleLinear().domain([-maxAbs * 1.25, maxAbs * 1.25]).range([ih, 0]);

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

    // All bars at dim opacity — year effect will highlight the current one.
    const bars = g.selectAll('rect.bar').data(data).enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.year))
      .attr('width', x.bandwidth())
      .attr('y', d => d.lgi >= 0 ? y(d.lgi) : y(0))
      .attr('height', d => Math.max(1, Math.abs(y(d.lgi) - y(0))))
      .attr('fill', d => d.lgi >= 0 ? 'var(--lgi)' : 'var(--lgr)')
      .attr('opacity', 0.4)
      .attr('rx', 2);

    const tip = d3.select(el).append('div').attr('class', 'chart-hover-tip').style('display', 'none');

    g.append('rect').attr('width', iw).attr('height', ih).attr('fill', 'none').attr('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mx] = d3.pointer(event);
        const hovYear = x.domain().find(yr => { const bx = x(yr); return mx >= bx && mx <= bx + x.bandwidth(); });
        if (!hovYear) return;
        const d = data.find(dd => dd.year === hovYear);
        if (!d) return;
        const color = d.lgi >= 0 ? 'var(--lgi)' : 'var(--lgr)';
        const label = Math.abs(d.lgi) < 1e-6 ? '—' : (d.lgi >= 0 ? '+' : '') + (d.lgi * 100).toFixed(2) + '%';
        const px = x(hovYear) + x.bandwidth() / 2;
        const flipRight = px + m.left > W * 0.6;
        tip.style('display', 'block')
          .style('left', flipRight ? null : px + m.left + 8 + 'px')
          .style('right', flipRight ? W - px - m.left + 8 + 'px' : null)
          .style('top', m.top + 'px')
          .html(`<div class="tip-year">${hovYear}</div><div class="tip-row"><span class="tip-dot" style="background:${color}"></span>${label}</div>`);
      })
      .on('mouseleave', () => tip.style('display', 'none'));

    d3Ref.current = { bars, data };
  }, [series, dark, height]);

  // Update only bar opacity — runs cheaply on every year change.
  useEffect(() => {
    const state = d3Ref.current;
    if (!state) return;
    state.bars.attr('opacity', d => d.year === year ? 1 : 0.4);
  }, [year, series, dark, height]);

  return <div ref={ref} className="chart" style={height != null ? { height } : undefined} />;
}
