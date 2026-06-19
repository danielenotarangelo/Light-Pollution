import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const TIER_LABELS = ['Low', 'Lower-Mid', 'Upper-Mid', 'High'];

function boxStats(values) {
  const sorted = [...values].sort(d3.ascending);
  const q1  = d3.quantile(sorted, 0.25);
  const med = d3.quantile(sorted, 0.50);
  const q3  = d3.quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const lo  = d3.min(sorted.filter(v => v >= q1 - 1.5 * iqr)) ?? sorted[0];
  const hi  = d3.max(sorted.filter(v => v <= q3 + 1.5 * iqr)) ?? sorted[sorted.length - 1];
  return { q1, med, q3, lo, hi };
}

// Deterministic per-country x jitter: same position every render
function jitterOf(name, width) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return ((h / 0xffff) - 0.5) * width;
}

export default function TierDistChart({ points, country, color, ylabel, dark, height, logScale = false }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    el.innerHTML = '';
    if (!points?.length) return;

    const W  = el.clientWidth  || 280;
    const H  = el.clientHeight || height || 180;
    const m  = { top: 8, right: 12, bottom: 34, left: 46 };
    const iw = W - m.left - m.right;
    const ih = H - m.top  - m.bottom;

    const ac = dark ? '#8892a8' : '#939bb2';
    const gc = dark ? '#3a4160' : '#e2e6ee';
    const bg = dark ? '#0d101c' : '#f8f9fc';
    const dotFill = dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.16)';

    const allVals  = points.map(p => p.value);
    const minV     = d3.min(allVals);
    const maxV     = d3.max(allVals);

    const x = d3.scaleBand().domain([0, 1, 2, 3]).range([0, iw]).padding(0.28);
    const y = logScale
      ? d3.scaleLog().domain([minV * 0.55, maxV * 2.2]).range([ih, 0]).clamp(true)
      : d3.scaleLinear().domain([minV * 0.93, maxV * 1.07]).range([ih, 0]);

    const svg = d3.select(el).append('svg').attr('width', W).attr('height', H);
    const g   = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    // Horizontal grid lines
    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickSize(-iw).tickFormat(''))
      .call(s => {
        s.select('.domain').remove();
        s.selectAll('line').attr('stroke', gc).attr('stroke-dasharray', '2,3');
      });

    // X axis
    g.append('g').attr('transform', `translate(0,${ih})`)
      .call(d3.axisBottom(x).tickFormat(i => TIER_LABELS[i]))
      .call(s => {
        s.selectAll('text').attr('fill', ac).style('font-size', '9px');
        s.selectAll('line,path').attr('stroke', gc);
      });

    // Y axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickFormat(d3.format('~s')))
      .call(s => {
        s.selectAll('text').attr('fill', ac).style('font-size', '9px');
        s.selectAll('line,path').attr('stroke', gc);
      });

    // Y label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -ih / 2).attr('y', -36)
      .attr('text-anchor', 'middle').attr('fill', ac).style('font-size', '8px')
      .text(ylabel);

    const bw         = x.bandwidth();
    const jitterW    = bw * 0.38;
    const boxInset   = bw * 0.14;
    const boxW       = bw - boxInset * 2;

    // Draw per tier
    [0, 1, 2, 3].forEach(tier => {
      const tierPts = points.filter(p => p.tier === tier);
      if (!tierPts.length) return;

      const cx      = x(tier) + bw / 2;
      const numbers = tierPts.map(p => p.value);
      const bs      = boxStats(numbers);

      // Jittered dots (drawn first, behind box)
      tierPts.forEach(({ name, value }) => {
        const isSelected = name === country;
        const jx = cx + jitterOf(name, jitterW);
        const vy = y(value);

        if (!isSelected) {
          g.append('circle')
            .attr('cx', jx).attr('cy', vy)
            .attr('r', 2)
            .attr('fill', dotFill);
        }
      });

      // Whisker lines (dashed)
      const whiskerX = cx;
      [[bs.lo, bs.q1], [bs.q3, bs.hi]].forEach(([a, b]) => {
        g.append('line')
          .attr('x1', whiskerX).attr('x2', whiskerX)
          .attr('y1', y(a)).attr('y2', y(b))
          .attr('stroke', color).attr('stroke-width', 1)
          .attr('stroke-dasharray', '2,2');
      });

      // Whisker caps
      const capW = bw * 0.18;
      [bs.lo, bs.hi].forEach(v => {
        g.append('line')
          .attr('x1', cx - capW).attr('x2', cx + capW)
          .attr('y1', y(v)).attr('y2', y(v))
          .attr('stroke', color).attr('stroke-width', 1.2);
      });

      // IQR box fill
      const boxTop = y(bs.q3);
      const boxH   = Math.max(1, y(bs.q1) - y(bs.q3));
      g.append('rect')
        .attr('x', x(tier) + boxInset)
        .attr('width', boxW)
        .attr('y', boxTop)
        .attr('height', boxH)
        .attr('fill', `${color}20`)
        .attr('stroke', color)
        .attr('stroke-width', 1.4)
        .attr('rx', 2);

      // Median line
      g.append('line')
        .attr('x1', x(tier) + boxInset)
        .attr('x2', x(tier) + boxInset + boxW)
        .attr('y1', y(bs.med)).attr('y2', y(bs.med))
        .attr('stroke', color).attr('stroke-width', 2);

      // Selected country dot — drawn on top
      const selPt = tierPts.find(p => p.name === country);
      if (selPt) {
        const jx = cx + jitterOf(selPt.name, jitterW);
        const vy = y(selPt.value);
        g.append('circle')
          .attr('cx', jx).attr('cy', vy)
          .attr('r', 4.5)
          .attr('fill', color)
          .attr('stroke', bg)
          .attr('stroke-width', 1.5);
      }
    });

    // Selected country label (once, above its dot)
    const selPt = points.find(p => p.name === country);
    if (selPt) {
      const cx  = x(selPt.tier) + bw / 2 + jitterOf(selPt.name, jitterW);
      const cy  = y(selPt.value);
      const lbl = selPt.name.length > 11 ? selPt.name.slice(0, 10) + '…' : selPt.name;
      const flipLeft = cx > iw * 0.65;
      g.append('text')
        .attr('x', flipLeft ? cx - 7 : cx + 7)
        .attr('y', cy - 7)
        .attr('text-anchor', flipLeft ? 'end' : 'start')
        .attr('fill', color)
        .style('font-size', '8px').style('font-weight', '700')
        .text(lbl);
    }

  }, [points, country, color, ylabel, dark, height, logScale]);

  return <div ref={ref} className="chart" style={height != null ? { height } : undefined} />;
}
