import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const COLOR_A = '#f59e0b';
const COLOR_B = '#38bdf8';

export default function LGIHistChart({ allPoints, country, compareCountry, dark, height }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    el.innerHTML = '';
    if (!allPoints?.length) return;

    const W  = el.clientWidth  || 286;
    const H  = el.clientHeight || height || 200;
    const m  = { top: 14, right: 14, bottom: 30, left: 38 };
    const iw = W - m.left - m.right;
    const ih = H - m.top  - m.bottom;

    const ac = dark ? '#8892a8' : '#939bb2';
    const gc = dark ? '#3a4160' : '#e2e6ee';

    const values = allPoints.map(p => p.lgi);

    const x = d3.scaleLinear()
      .domain(d3.extent(values))
      .range([0, iw])
      .nice();

    const bins = d3.bin().domain(x.domain()).thresholds(x.ticks(22))(values);

    const y = d3.scaleLinear()
      .domain([0, d3.max(bins, b => b.length)])
      .range([ih, 0])
      .nice();

    const lgiColor = getComputedStyle(el).getPropertyValue('--lgi').trim() || '#2563eb';
    const lgrColor = getComputedStyle(el).getPropertyValue('--lgr').trim() || '#ef4444';

    d3.select(el).style('position', 'relative');
    const svg = d3.select(el).append('svg').attr('width', W).attr('height', H);
    const g   = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    // Horizontal grid
    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickSize(-iw).tickFormat(''))
      .call(s => {
        s.select('.domain').remove();
        s.selectAll('line').attr('stroke', gc).attr('stroke-dasharray', '2,3');
      });

    // X axis
    g.append('g').attr('transform', `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(v => (v >= 0 ? '+' : '') + d3.format('.0%')(v)))
      .call(s => {
        s.selectAll('text').attr('fill', ac).style('font-size', '9px');
        s.selectAll('line,path').attr('stroke', gc);
      });

    // Y axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(4))
      .call(s => {
        s.selectAll('text').attr('fill', ac).style('font-size', '9px');
        s.selectAll('line,path').attr('stroke', gc);
      });

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -ih / 2).attr('y', -28)
      .attr('text-anchor', 'middle').attr('fill', ac).style('font-size', '8px')
      .text('countries');

    // Zero baseline
    const x0 = x(0);
    if (x0 > 0 && x0 < iw) {
      g.append('line')
        .attr('x1', x0).attr('x2', x0).attr('y1', 0).attr('y2', ih)
        .attr('stroke', gc).attr('stroke-width', 1).attr('stroke-dasharray', '3,2');
    }

    // Histogram bars
    g.selectAll('rect.hbin').data(bins).enter().append('rect')
      .attr('class', 'hbin')
      .attr('x',      b => x(b.x0) + 0.5)
      .attr('width',  b => Math.max(0, x(b.x1) - x(b.x0) - 1))
      .attr('y',      b => y(b.length))
      .attr('height', b => ih - y(b.length))
      .attr('fill',   b => b.x0 >= 0 ? lgiColor : lgrColor)
      .attr('opacity', 0.45)
      .attr('rx', 1.5);

    // Helper to draw a country marker line + label
    const drawMarker = (name, color, labelRow) => {
      const pt = allPoints.find(p => p.name === name);
      if (!pt) return;
      const px      = x(pt.lgi);
      const flipLeft = px > iw * 0.6;
      g.append('line')
        .attr('x1', px).attr('x2', px).attr('y1', 0).attr('y2', ih)
        .attr('stroke', color).attr('stroke-width', 2);
      const lbl = name.length > 13 ? name.slice(0, 12) + '…' : name;
      g.append('text')
        .attr('x', flipLeft ? px - 5 : px + 5)
        .attr('y', 10 + labelRow * 13)
        .attr('text-anchor', flipLeft ? 'end' : 'start')
        .attr('fill', color)
        .style('font-size', '8px').style('font-weight', '700')
        .text(lbl);
    };

    drawMarker(country,        COLOR_A, 0);
    drawMarker(compareCountry, COLOR_B, 1);

    // Hover tooltip
    const tip = d3.select(el).append('div').attr('class', 'chart-hover-tip').style('display', 'none');
    const fmtPct = v => (v >= 0 ? '+' : '') + d3.format('.1%')(v);

    g.append('rect').attr('width', iw).attr('height', ih).attr('fill', 'none').attr('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mx] = d3.pointer(event);
        const bin  = bins.find(b => mx >= x(b.x0) && mx < x(b.x1));
        if (!bin || !bin.length) { tip.style('display', 'none'); return; }
        const flipRight = mx + m.left > W * 0.6;
        tip.style('display', 'block')
          .style('left',  flipRight ? null  : mx + m.left + 8 + 'px')
          .style('right', flipRight ? W - mx - m.left + 8 + 'px' : null)
          .style('top',   m.top + 'px')
          .html(`<div class="tip-year">${fmtPct(bin.x0)} – ${fmtPct(bin.x1)}</div>
            <div class="tip-row">${bin.length} countr${bin.length === 1 ? 'y' : 'ies'}</div>`);
      })
      .on('mouseleave', () => tip.style('display', 'none'));

  }, [allPoints, country, compareCountry, dark, height]);

  return <div ref={ref} className="chart" style={height != null ? { height } : undefined} />;
}
