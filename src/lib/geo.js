import * as d3 from 'd3';
import { getVal, makeColorScale } from './data.js';

// Convert a point on the unit sphere (local globe space) to [lat, lon].
export function vec3ToLatLon(p) {
  const len = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
  const v = { x: p.x / len, y: p.y / len, z: p.z / len };
  const lat = 90 - (Math.acos(v.y) * 180) / Math.PI;
  let lon = (Math.atan2(v.z, -v.x) * 180) / Math.PI - 180;
  while (lon < -180) lon += 360;
  while (lon > 180) lon -= 360;
  return [lat, lon];
}

// Find which country polygon contains a given [lat, lon].
export function countryAtLatLon(geo, lat, lon) {
  for (const f of geo.features) {
    if (d3.geoContains(f, [lon, lat])) return f.properties.name;
  }
  return null;
}

// Texture dimensions for the choropleth overlay canvas.
export const TEX_W = 2048;
export const TEX_H = 1024;

// Build the d3 path generator bound to a 2D canvas context, using an
// equirectangular projection that maps cleanly onto sphere UVs.
export function makeGeoPath(ctx) {
  const projection = d3
    .geoEquirectangular()
    .scale(TEX_W / (2 * Math.PI))
    .translate([TEX_W / 2, TEX_H / 2]);
  return d3.geoPath(projection, ctx);
}

// Paint the choropleth overlay onto the offscreen canvas context.
// Transparent everywhere except data countries, so the satellite Earth
// shows through.
export function paintOverlay({ ctx, geoPath, geo, data, year, variable, healthMetric, selected }) {
  const colorScale = makeColorScale(data.domains, variable, healthMetric);
  ctx.clearRect(0, 0, TEX_W, TEX_H);
  geo.features.forEach((f) => {
    const name = f.properties.name;
    const v = getVal(data.lookup, name, year, variable, healthMetric);
    ctx.beginPath();
    geoPath(f);
    if (v == null) {
      ctx.fillStyle = 'rgba(120,130,150,0.15)';
    } else {
      const c = d3.color(colorScale(v));
      c.opacity = 0.82;
      ctx.fillStyle = c + '';
    }
    ctx.fill();
    ctx.lineWidth = name === selected ? 4 : 0.8;
    ctx.strokeStyle = name === selected ? '#ffffff' : 'rgba(255,255,255,0.25)';
    ctx.stroke();
  });
}
