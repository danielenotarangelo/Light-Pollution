import * as d3 from 'd3';
import { VAR_META } from './constants.js';

// Resolve the active variable key (health → chosen sub-metric).
export function activeVarKey(variable, healthMetric) {
  return variable === 'health' ? healthMetric : variable;
}

// Look up a single value for a country/year/variable from the bundle.
export function getVal(lookup, country, year, variable, healthMetric) {
  const c = lookup[country];
  if (!c) return null;
  const y = c[year];
  if (!y) return null;
  const k = variable === 'health' ? healthMetric : variable;
  return y[k];
}

// Build a color scale for the current variable. Radiance uses a log
// transform so the many dim countries don't all collapse to one color.
export function makeColorScale(domains, variable, healthMetric) {
  const k = variable === 'health' ? healthMetric : variable;
  const dom = domains[k];
  const meta = VAR_META[k];
  if (k === 'r') {
    const ls = d3
      .scaleSequential(meta.interp)
      .domain([Math.log(dom.min + 0.5), Math.log(dom.max + 0.5)]);
    return (v) => ls(Math.log(Math.max(v, 0) + 0.5));
  }
  const s = d3.scaleSequential(meta.interp).domain([dom.min, dom.max]);
  return (v) => s(v);
}

// Format a value for display given its variable key.
export function fmt(v, k) {
  if (v == null) return '—';
  if (k === 'g') return '$' + d3.format(',.0f')(v);
  if (k === 'r') return d3.format('.2f')(v);
  return d3.format(',.0f')(v);
}

// Extract a sorted time series for one country.
export function getSeries(lookup, years, country) {
  const c = lookup[country];
  if (!c) return [];
  return years.filter((y) => c[y]).map((y) => ({ year: y, ...c[y] }));
}
