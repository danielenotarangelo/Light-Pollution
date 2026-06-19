import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const COLOR_A = '#f59e0b';
const COLOR_B = '#38bdf8';

export default function MetricChart({ series, compareSeries, metricKey, year, color = '#10b981', dark, height, fmt }) {
  const ref   = useRef(null);
  const d3Ref = useRef(null);

  useEffect(() => {
    d3Ref.current = null;
    const el = ref.current;
    el.innerHTML = '';
    const data    = (series || []).filter(d => d[metricKey] != null);
    if (!data.length) return;
    const cmpData   = (compareSeries || []).filter(d => d[metricKey] != null);
    const isCompare = cmpData.length > 0;

    const W  = el.clientWidth || 286;
    const H  = el.clientHeight || height || 160;
    const m  = { top: 12, right: 12, bottom: 22, left: 46 };
    const iw = W - m.left - m.right;
    const ih = H - m.top - m.bottom;
    const ac = dark ? '#5b647d' : '#939bb2';
    const gc = dark ? '#2a3048' : '#e2e6ee';
    const bg = dark ? '#0d101c' : '#f8f9fc';

    d3.select(el).style('position', 'relative');
    const svg = d3.select(el).append('svg').attr('width', W).attr('height', H);
    const g   = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    const allVals = [...data, ...cmpData].map(d => d[metricKey]);
    const ext = d3.extent(allVals);
    const pad = (ext[1] - ext[0]) * 0.12 || 1;
    const xLine = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([0, iw]);
    const y     = d3.scaleLinear().domain([Math.max(0, ext[0] - pad), ext[1] + pad]).range([ih, 0]);

    const colorA = isCompare ? COLOR_A : color;

    // Area fill (solo mode only)
    if (!isCompare) {
      g.append('path').datum(data)
        .attr('fill', color).attr('opacity', 0.12)
        .attr('d', d3.area().x(d => xLine(d.year)).y0(ih).y1(d => y(d[metricKey])).curve(d3.curveMonotoneX));
    }

    // Lines
    const lineGen = d3.line().defined(d => d[metricKey] != null)
      .x(d => xLine(d.year)).y(d => y(d[metricKey])).curve(d3.curveMonotoneX);

    if (isCompare) {
      g.append('path').datum(cmpData).attr('fill', 'none')
        .attr('stroke', COLOR_B).attr('stroke-width', 2).attr('d', lineGen);
    }
    g.append('path').datum(data).attr('fill', 'none')
      .attr('stroke', colorA).attr('stroke-width', 2).attr('d', lineGen);

    // Axes
    const xBand = d3.scaleBand().domain(data.map(d => d.year)).range([0, iw]).padding(0);
    g.append('g').attr('transform', `translate(0,${ih})`)
      .call(d3.axisBottom(xBand)
        .tickValues(data.filter((_, i) => i % 2 === 0).map(d => d.year))
        .tickFormat(d3.format('d')))
      .call(s => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));

    const fmtFn = fmt || (v => d3.format(',.0f')(v));
    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickFormat(fmtFn))
      .call(s => s.selectAll('text').attr('fill', isCompare ? ac : ac).style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));

    // Dots
    const dotsA = g.selectAll('circle.dot-a').data(data).enter().append('circle')
      .attr('class', 'dot-a')
      .attr('cx', d => xLine(d.year)).attr('cy', d => y(d[metricKey]))
      .attr('r', 3).attr('fill', colorA).attr('opacity', 0.3);

    let dotsB = null;
    if (isCompare) {
      dotsB = g.selectAll('circle.dot-b').data(cmpData).enter().append('circle')
        .attr('class', 'dot-b')
        .attr('cx', d => xLine(d.year)).attr('cy', d => y(d[metricKey]))
        .attr('r', 3).attr('fill', COLOR_B).attr('opacity', 0.3);
    }

    // Year marker: vertical dashed line + dots
    const markerG = g.append('g').style('display', 'none');
    const mLine   = markerG.append('line').attr('y1', 0).attr('y2', ih)
      .attr('stroke', ac).attr('stroke-dasharray', '2,2').attr('opacity', 0.45);
    const mDotA = markerG.append('circle').attr('r', 4)
      .attr('fill', colorA).attr('stroke', bg).attr('stroke-width', 2);
    const mDotB = isCompare
      ? markerG.append('circle').attr('r', 4).attr('fill', COLOR_B).attr('stroke', bg).attr('stroke-width', 2)
      : null;

    // Tooltip
    const tip = d3.select(el).append('div').attr('class', 'chart-hover-tip').style('display', 'none');
    g.append('rect').attr('width', iw).attr('height', ih)
      .attr('fill', 'none').attr('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mx] = d3.pointer(event);
        const yr   = Math.round(xLine.invert(mx));
        const d    = data.find(dd => dd.year === yr);
        if (!d) return;
        const cx        = xLine(d.year);
        const flipRight = cx + m.left > W * 0.6;
        let html = `<div class="tip-year">${d.year}</div>
          <div class="tip-row"><span class="tip-dot" style="background:${colorA}"></span>${fmtFn(d[metricKey])}</div>`;
        if (isCompare) {
          const dc = cmpData.find(dd => dd.year === yr);
          if (dc) html += `<div class="tip-row"><span class="tip-dot" style="background:${COLOR_B}"></span>${fmtFn(dc[metricKey])}</div>`;
        }
        tip.style('display', 'block')
          .style('left',  flipRight ? null : cx + m.left + 8 + 'px')
          .style('right', flipRight ? W - cx - m.left + 8 + 'px' : null)
          .style('top', m.top + 'px')
          .html(html);
      })
      .on('mouseleave', () => tip.style('display', 'none'));

    d3Ref.current = { dotsA, dotsB, data, cmpData, isCompare, xLine, y, markerG, mLine, mDotA, mDotB, metricKey };
  }, [series, compareSeries, metricKey, color, dark, height, fmt]);

  useEffect(() => {
    const state = d3Ref.current;
    if (!state) return;
    const { dotsA, dotsB, data, cmpData, xLine, y, markerG, mLine, mDotA, mDotB, metricKey: mk } = state;

    dotsA.attr('opacity', d => d.year === year ? 1 : 0.3).attr('r', d => d.year === year ? 4.5 : 3);
    dotsB?.attr('opacity', d => d.year === year ? 1 : 0.3).attr('r', d => d.year === year ? 4.5 : 3);

    const cy = data.find(d => d.year === year);
    if (!cy) { markerG.style('display', 'none'); return; }
    markerG.style('display', null);
    mLine.attr('x1', xLine(year)).attr('x2', xLine(year));
    mDotA.attr('cx', xLine(year)).attr('cy', y(cy[mk]));
    if (mDotB) {
      const cc = cmpData.find(d => d.year === year);
      if (cc) mDotB.attr('cx', xLine(year)).attr('cy', y(cc[mk]));
    }
  }, [year, series, compareSeries, metricKey, dark]);

  return <div ref={ref} className="chart" style={height != null ? { height } : undefined} />;
}
