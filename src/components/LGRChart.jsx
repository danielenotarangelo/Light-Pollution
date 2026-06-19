import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const COLOR_A = '#f59e0b';
const COLOR_B = '#38bdf8';

export default function LGRChart({ series, compareSeries, year, dark, height }) {
  const ref   = useRef(null);
  const d3Ref = useRef(null);

  useEffect(() => {
    d3Ref.current = null;
    const el = ref.current;
    el.innerHTML = '';
    if (!series?.length) return;

    const data    = series.filter(d => d.lgr != null).map(d => ({ ...d, v: d.lgr * 1e4 }));
    if (!data.length) return;
    const cmpData   = (compareSeries || []).filter(d => d.lgr != null).map(d => ({ ...d, v: d.lgr * 1e4 }));
    const isCompare = cmpData.length > 0;

    const W  = el.clientWidth || 286;
    const H  = el.clientHeight || height || 200;
    const m  = { top: 12, right: 16, bottom: 22, left: 46 };
    const iw = W - m.left - m.right;
    const ih = H - m.top - m.bottom;
    const ac = dark ? '#5b647d' : '#939bb2';
    const gc = dark ? '#2a3048' : '#e2e6ee';
    const bg = dark ? '#0d101c' : '#f8f9fc';

    d3.select(el).style('position', 'relative');
    const svg = d3.select(el).append('svg').attr('width', W).attr('height', H);
    const g   = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    const allV = [...data.map(d => d.v), ...cmpData.map(d => d.v)];
    const yExt = d3.extent(allV);
    const pad  = (yExt[1] - yExt[0]) * 0.18 || 0.3;
    const x    = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([0, iw]);
    const y    = d3.scaleLinear().domain([yExt[0] - pad, yExt[1] + pad]).range([ih, 0]);

    const axisColor = isCompare ? ac : 'var(--lgr)';

    g.append('g').attr('transform', `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('d')))
      .call(s => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));
    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickFormat(v => d3.format('.2f')(v)))
      .call(s => s.selectAll('text').attr('fill', axisColor).style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));
    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickSize(-iw).tickFormat(''))
      .call(s => s.selectAll('line').attr('stroke', gc).attr('stroke-dasharray', '2,3'))
      .call(s => s.select('.domain').remove());

    const lineGen = d3.line().x(d => x(d.year)).y(d => y(d.v)).curve(d3.curveMonotoneX);
    const areaGen = d3.area().x(d => x(d.year)).y0(ih).y1(d => y(d.v)).curve(d3.curveMonotoneX);

    if (isCompare) {
      // Both lines solid, equal weight, country colors
      g.append('path').datum(cmpData).attr('fill', 'none')
        .attr('stroke', COLOR_B).attr('stroke-width', 2).attr('d', lineGen);
      g.append('path').datum(data).attr('fill', 'none')
        .attr('stroke', COLOR_A).attr('stroke-width', 2).attr('d', lineGen);
    } else {
      g.append('path').datum(data).attr('fill', 'var(--lgr)').attr('opacity', 0.08).attr('d', areaGen);
      g.append('path').datum(data).attr('fill', 'none')
        .attr('stroke', 'var(--lgr)').attr('stroke-width', 2).attr('d', lineGen);
    }

    const dotsA = g.selectAll('circle.pt-a').data(data).enter().append('circle')
      .attr('class', 'pt-a')
      .attr('cx', d => x(d.year)).attr('cy', d => y(d.v))
      .attr('r', 3)
      .attr('fill', isCompare ? COLOR_A : 'var(--lgr)')
      .attr('stroke', 'none').attr('opacity', 0.6);

    let dotsB = null;
    if (isCompare) {
      dotsB = g.selectAll('circle.pt-b').data(cmpData).enter().append('circle')
        .attr('class', 'pt-b')
        .attr('cx', d => x(d.year)).attr('cy', d => y(d.v))
        .attr('r', 3).attr('fill', COLOR_B).attr('stroke', 'none').attr('opacity', 0.6);
    }

    // Year marker: vertical dashed line + dots
    const markerG = g.append('g').style('display', 'none');
    const mLine   = markerG.append('line').attr('y1', 0).attr('y2', ih)
      .attr('stroke', ac).attr('stroke-dasharray', '2,2').attr('opacity', 0.45);
    const mDotA = markerG.append('circle').attr('r', 5)
      .attr('fill', isCompare ? COLOR_A : 'var(--lgr)').attr('stroke', bg).attr('stroke-width', 2);
    const mDotB = isCompare
      ? markerG.append('circle').attr('r', 5).attr('fill', COLOR_B).attr('stroke', bg).attr('stroke-width', 2)
      : null;

    const tip = d3.select(el).append('div').attr('class', 'chart-hover-tip').style('display', 'none');

    g.append('rect').attr('width', iw).attr('height', ih).attr('fill', 'none').attr('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mx]   = d3.pointer(event);
        const xv     = x.invert(mx);
        const closest = data.reduce((a, b) => Math.abs(b.year - xv) < Math.abs(a.year - xv) ? b : a);
        const px       = x(closest.year);
        const flipRight = px + m.left > W * 0.6;
        let html = `<div class="tip-year">${closest.year}</div>
          <div class="tip-row"><span class="tip-dot" style="background:${isCompare ? COLOR_A : 'var(--lgr)'}"></span>${d3.format('.3f')(closest.v)} ×10⁻⁴</div>`;
        if (isCompare) {
          const cc = cmpData.find(d => d.year === closest.year);
          if (cc) html += `<div class="tip-row"><span class="tip-dot" style="background:${COLOR_B}"></span>${d3.format('.3f')(cc.v)} ×10⁻⁴</div>`;
        }
        tip.style('display', 'block')
          .style('left',  flipRight ? null : px + m.left + 8 + 'px')
          .style('right', flipRight ? W - px - m.left + 8 + 'px' : null)
          .style('top', m.top + 'px')
          .html(html);
      })
      .on('mouseleave', () => tip.style('display', 'none'));

    d3Ref.current = { dotsA, dotsB, data, cmpData, isCompare, x, y, bg, markerG, mLine, mDotA, mDotB };
  }, [series, compareSeries, dark, height]);

  useEffect(() => {
    const state = d3Ref.current;
    if (!state) return;
    const { dotsA, dotsB, data, cmpData, isCompare, x, y, markerG, mLine, mDotA, mDotB } = state;
    const bgCol = dark ? '#0d101c' : '#f8f9fc';

    dotsA
      .attr('r',            d => d.year === year ? 5 : 3)
      .attr('opacity',      d => d.year === year ? 1 : 0.6)
      .attr('stroke',       d => d.year === year ? bgCol : 'none')
      .attr('stroke-width', 2);

    dotsB?.attr('r',            d => d.year === year ? 5 : 3)
          .attr('opacity',      d => d.year === year ? 1 : 0.6)
          .attr('stroke',       d => d.year === year ? bgCol : 'none')
          .attr('stroke-width', 2);

    const cy = data.find(d => d.year === year);
    if (!cy) { markerG.style('display', 'none'); return; }
    markerG.style('display', null);
    mLine.attr('x1', x(year)).attr('x2', x(year));
    mDotA.attr('cx', x(year)).attr('cy', y(cy.v));
    if (mDotB) {
      const cc = cmpData.find(d => d.year === year);
      if (cc) mDotB.attr('cx', x(year)).attr('cy', y(cc.v));
    }
  }, [year, dark, series, compareSeries, height]);

  return <div ref={ref} className="chart" style={height != null ? { height } : undefined} />;
}
