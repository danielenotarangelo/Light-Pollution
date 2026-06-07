import * as d3 from 'd3';

// The three encodable variables plus the two health sub-metrics.
export const VAR_META = {
  r: { key: 'r', label: 'Mean radiance', unit: 'nW/cm²/sr', interp: d3.interpolateInferno },
  g: { key: 'g', label: 'GDP per capita', unit: 'USD', interp: d3.interpolateViridis },
  d: { key: 'd', label: 'Depressive disorders', unit: '/100k', interp: d3.interpolateMagma },
  a: { key: 'a', label: 'Anxiety disorders', unit: '/100k', interp: d3.interpolateMagma },
};

export const YEARS = [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];

export const YEAR_CAPTIONS = {
  2013: 'The dawn of the VIIRS record.',
  2014: 'Emerging economies begin to brighten.',
  2015: 'LED conversion accelerates worldwide.',
  2016: 'Rapid electrification across Sub-Saharan Africa.',
  2017: 'Asia\u2019s megacities reach peak luminosity.',
  2018: 'Light continues outpacing population growth.',
  2019: 'The last full year before the pandemic.',
  2020: 'COVID-19 dims economies, not the lights.',
  2021: 'Recovery is uneven across regions.',
  2022: 'Energy crises prompt some dimming in Europe.',
  2023: 'The most recent complete year on record.',
};

export const TEXTURES = {
  day: '/textures/earth-day-4k.jpg',
  bump: '/textures/earth-topology.png',
  spec: '/textures/earth-water.png',
  clouds: '/textures/earth-clouds.jpg',
  fallback: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
};

export const GLOBE_RADIUS = 2;
