import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function LGRChart({ series, year, dark, height }) {
  const ref = useRef(null);
  const d3Ref = useRef(null);

  // Build full SVG — only when data, theme, or size change.
  useEffect(() => {
    d3Ref.current = null;
    const el = ref.current;
    el.innerHTML = '';
    if (!series?.length) return;

    const data = series.filter(d => d.lgr != null).map(d => ({ ...d, v: d.lgr * 1e4 }));
    if (!data.length) return;

    const W = el.clientWidth || 286;
    const H = el.clientHeight || height || 200;
    const m = { top: 12, right: 16, bottom: 22, left: 46 };
    const iw = W - m.left - m.right;
    const ih = H - m.top - m.bottom;
    const ac = dark ? '#5b647d' : '#939bb2';
    const gc = dark ? '#2a3048' : '#e2e6ee';

    d3.select(el).style('position', 'relative');
    const svg = d3.select(el).append('svg').attr('width', W).attr('height', H);
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([0, iw]);
    const yExt = d3.extent(data, d => d.v);
    const pad = (yExt[1] - yExt[0]) * 0.18 || 0.3;
    const y = d3.scaleLinear().domain([yExt[0] - pad, yExt[1] + pad]).range([ih, 0]);

    g.append('g').attr('transform', `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('d')))
      .call(s => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));
    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickFormat(v => d3.format('.2f')(v)))
      .call(s => s.selectAll('text').attr('fill', 'var(--lgr)').style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));
    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickSize(-iw).tickFormat(''))
      .call(s => s.selectAll('line').attr('stroke', gc).attr('stroke-dasharray', '2,3'))
      .call(s => s.select('.domain').remove());

    g.append('path').datum(data).attr('fill', 'var(--lgr)').attr('opacity', 0.08)
      .attr('d', d3.area().x(d => x(d.year)).y0(ih).y1(d => y(d.v)).curve(d3.curveMonotoneX));
    g.append('path').datum(data).attr('fill', 'none').attr('stroke', 'var(--lgr)').attr('stroke-width', 2)
      .attr('d', d3.line().x(d => x(d.year)).y(d => y(d.v)).curve(d3.curveMonotoneX));

    // All dots at base style — year effect will highlight the current one.
    const dots = g.selectAll('circle.pt').data(data).enter().append('circle')
      .attr('class', 'pt')
      .attr('cx', d => x(d.year))
      .attr('cy', d => y(d.v))
      .attr('r', 3)
      .attr('fill', 'var(--lgr)')
      .attr('stroke', 'none')
      .attr('opacity', 0.6);

    const tip = d3.select(el).append('div').attr('class', 'chart-hover-tip').style('display', 'none');

    g.append('rect').attr('width', iw).attr('height', ih).attr('fill', 'none').attr('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mx] = d3.pointer(event);
        const xv = x.invert(mx);
        const closest = data.reduce((a, b) => Math.abs(b.year - xv) < Math.abs(a.year - xv) ? b : a);
        const px = x(closest.year);
        const flipRight = px + m.left > W * 0.6;
        tip.style('display', 'block')
          .style('left', flipRight ? null : px + m.left + 8 + 'px')
          .style('right', flipRight ? W - px - m.left + 8 + 'px' : null)
          .style('top', m.top + 'px')
          .html(`<div class="tip-year">${closest.year}</div><div class="tip-row"><span class="tip-dot" style="background:var(--lgr)"></span>${d3.format('.3f')(closest.v)} ×10⁻⁴</div>`);
      })
      .on('mouseleave', () => tip.style('display', 'none'));

    d3Ref.current = { dots, data, dark };
  }, [series, dark, height]);

  // Update only the highlighted dot — runs cheaply on every year change.
  useEffect(() => {
    const state = d3Ref.current;
    if (!state) return;
    const bg = dark ? '#0d101c' : '#f8f9fc';
    state.dots
      .attr('r', d => d.year === year ? 5 : 3)
      .attr('opacity', d => d.year === year ? 1 : 0.6)
      .attr('stroke', d => d.year === year ? bg : 'none')
      .attr('stroke-width', 2);
  }, [year, dark, series, height]);

  return <div ref={ref} className="chart" style={height != null ? { height } : undefined} />;
}
