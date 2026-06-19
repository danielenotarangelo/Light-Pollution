import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const COLOR_A = '#f59e0b';
const COLOR_B = '#38bdf8';

export default function LGILineChart({ series, compareSeries, year, dark, height }) {
  const ref   = useRef(null);
  const d3Ref = useRef(null);

  useEffect(() => {
    d3Ref.current = null;
    const el = ref.current;
    el.innerHTML = '';
    if (!series?.length) return;

    const data    = series.filter(d => d.lgi != null);
    if (!data.length) return;
    const cmpData  = (compareSeries || []).filter(d => d.lgi != null);
    const isCompare = cmpData.length > 0;

    // Resolve --lgi CSS var for single-country mode
    const lgiHex   = getComputedStyle(el).getPropertyValue('--lgi').trim() || '#2563eb';
    const colorA   = isCompare ? COLOR_A : lgiHex;

    const W  = el.clientWidth || 286;
    const H  = el.clientHeight || height || 200;
    const m  = { top: 14, right: 16, bottom: 22, left: 46 };
    const iw = W - m.left - m.right;
    const ih = H - m.top - m.bottom;
    const ac = dark ? '#5b647d' : '#939bb2';
    const gc = dark ? '#2a3048' : '#e2e6ee';
    const bg = dark ? '#0d101c' : '#f8f9fc';

    const allAbs = [...data, ...cmpData].map(d => Math.abs(d.lgi));
    const maxAbs = d3.max(allAbs) || 0.1;

    d3.select(el).style('position', 'relative');
    const svg = d3.select(el).append('svg').attr('width', W).attr('height', H);
    const g   = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([0, iw]);
    const y = d3.scaleLinear().domain([-maxAbs * 1.3, maxAbs * 1.3]).range([ih, 0]);

    // Axes
    g.append('g').attr('transform', `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('d')))
      .call(s => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));
    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickFormat(v => (v >= 0 ? '+' : '') + d3.format('.0%')(v)))
      .call(s => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));

    // Zero baseline
    g.append('line').attr('x1', 0).attr('x2', iw).attr('y1', y(0)).attr('y2', y(0))
      .attr('stroke', gc).attr('stroke-width', 1).attr('stroke-dasharray', '3,2');

    const lineGen = d3.line().defined(d => d.lgi != null)
      .x(d => x(d.year)).y(d => y(d.lgi)).curve(d3.curveMonotoneX);
    const areaGen = d3.area().defined(d => d.lgi != null)
      .x(d => x(d.year)).y0(y(0)).y1(d => y(d.lgi)).curve(d3.curveMonotoneX);

    // ── Primary series ──
    g.append('path').datum(data).attr('fill', colorA).attr('opacity', 0.1).attr('d', areaGen);
    g.append('path').datum(data)
      .attr('fill', 'none').attr('stroke', colorA).attr('stroke-width', 2).attr('d', lineGen);

    const dotsA = g.selectAll('circle.dot-a').data(data).enter().append('circle')
      .attr('class', 'dot-a')
      .attr('cx', d => x(d.year)).attr('cy', d => y(d.lgi))
      .attr('r', 3).attr('fill', colorA).attr('stroke', bg).attr('stroke-width', 1.5)
      .attr('opacity', 0.5);

    // ── Compare series ──
    let dotsB = null;
    if (isCompare) {
      g.append('path').datum(cmpData).attr('fill', COLOR_B).attr('opacity', 0.1).attr('d', areaGen);
      g.append('path').datum(cmpData)
        .attr('fill', 'none').attr('stroke', COLOR_B).attr('stroke-width', 2).attr('d', lineGen);

      dotsB = g.selectAll('circle.dot-b').data(cmpData).enter().append('circle')
        .attr('class', 'dot-b')
        .attr('cx', d => x(d.year)).attr('cy', d => y(d.lgi))
        .attr('r', 3).attr('fill', COLOR_B).attr('stroke', bg).attr('stroke-width', 1.5)
        .attr('opacity', 0.5);
    }

    // ── Year marker (vertical dashed line + dots) ──
    const markerG = g.append('g').style('display', 'none');
    const mLine   = markerG.append('line').attr('y1', 0).attr('y2', ih)
      .attr('stroke', ac).attr('stroke-dasharray', '2,2').attr('opacity', 0.45);
    const mDotA   = markerG.append('circle').attr('r', 5)
      .attr('fill', colorA).attr('stroke', bg).attr('stroke-width', 2);
    const mDotB   = isCompare
      ? markerG.append('circle').attr('r', 5).attr('fill', COLOR_B).attr('stroke', bg).attr('stroke-width', 2)
      : null;

    // ── Hover tooltip ──
    const tip    = d3.select(el).append('div').attr('class', 'chart-hover-tip').style('display', 'none');
    const fmtPct = v => v == null || Math.abs(v) < 1e-8 ? '—'
      : (v >= 0 ? '+' : '') + (Math.abs(v * 100) >= 1 ? (v * 100).toFixed(0) : (v * 100).toFixed(1)) + '%';

    g.append('rect').attr('width', iw).attr('height', ih).attr('fill', 'none').attr('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mx]    = d3.pointer(event);
        const hovYear = Math.round(x.invert(mx));
        const d       = data.find(dd => dd.year === hovYear);
        if (!d) return;
        const px       = x(hovYear);
        const flipRight = px + m.left > W * 0.6;
        let html = `<div class="tip-year">${hovYear}</div>
          <div class="tip-row"><span class="tip-dot" style="background:${colorA}"></span>${fmtPct(d.lgi)}</div>`;
        if (isCompare) {
          const dc = cmpData.find(dd => dd.year === hovYear);
          if (dc) html += `<div class="tip-row"><span class="tip-dot" style="background:${COLOR_B}"></span>${fmtPct(dc.lgi)}</div>`;
        }
        tip.style('display', 'block')
          .style('left',  flipRight ? null  : px + m.left + 8 + 'px')
          .style('right', flipRight ? W - px - m.left + 8 + 'px' : null)
          .style('top',   m.top + 'px')
          .html(html);
      })
      .on('mouseleave', () => tip.style('display', 'none'));

    d3Ref.current = { x, y, data, cmpData, dotsA, dotsB, markerG, mLine, mDotA, mDotB, colorA };
  }, [series, compareSeries, dark, height]);

  // ── Year highlight effect ──
  useEffect(() => {
    const s = d3Ref.current;
    if (!s) return;
    const { x, y, data, cmpData, dotsA, dotsB, markerG, mLine, mDotA, mDotB } = s;

    dotsA.attr('r', d => d.year === year ? 5 : 3).attr('opacity', d => d.year === year ? 1 : 0.4);
    dotsB?.attr('r', d => d.year === year ? 5 : 3).attr('opacity', d => d.year === year ? 1 : 0.4);

    const cy = data.find(d => d.year === year);
    if (!cy) { markerG.style('display', 'none'); return; }
    markerG.style('display', null);
    mLine.attr('x1', x(year)).attr('x2', x(year));
    mDotA.attr('cx', x(year)).attr('cy', y(cy.lgi));
    if (mDotB) {
      const cc = cmpData.find(d => d.year === year);
      if (cc) mDotB.attr('cx', x(year)).attr('cy', y(cc.lgi));
    }
  }, [year, series, compareSeries, dark, height]);

  return <div ref={ref} className="chart" style={height != null ? { height } : undefined} />;
}
