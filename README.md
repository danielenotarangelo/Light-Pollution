# Nights of Light

An interactive 3D globe exploring the relationship between **artificial light at
night**, **economic development**, and **human health** across the world from
2013 to 2023.

Built for the Data Visualization Lab exam. The globe is the primary navigation
element: click any country to open floating panels showing its light-vs-wealth
trajectory and its position in the global light-vs-health distribution. A
timeline scrubs through the years, and three toggles re-encode the globe by
light, wealth, or health.

## Tech stack

- **React 18 + Vite** — UI and build tooling
- **Three.js** — realistic 3D Earth (satellite texture, specular oceans, clouds, starfield)
- **D3** — choropleth projection, color scales, and the two panel charts
- **Python** (pipeline, separate) — data acquisition, merging, and asset generation

## Getting started

```bash
# from the project root
npm install
npm run dev
```

Then open http://localhost:5173. To build for production:

```bash
npm run build
npm run preview
```

> The Earth textures load from a CDN (jsDelivr), so the first load needs an
> internet connection. If a texture fails, the globe falls back to a Blue Marble
> image and the loading overlay dismisses automatically.

## Project structure

```
light-pollution-viz/
├── public/
│   ├── data/
│   │   ├── data_bundle.json      # { lookup, domains, years } — used by the app
│   │   ├── countries.geojson     # simplified country polygons for the globe
│   │   ├── master_dataset.json   # full nested dataset (reference)
│   │   └── master_dataset.csv    # flat dataset (reference / debugging)
│   └── textures/                 # (optional) drop local 4k/8k Earth textures here
├── src/
│   ├── components/
│   │   ├── Globe.jsx             # Three.js scene, interaction, choropleth overlay
│   │   ├── Header.jsx            # title, variable toggles, theme switch
│   │   ├── Legend.jsx            # color spectrum for the active variable
│   │   ├── Timeline.jsx          # year slider, ticks, play/pause
│   │   ├── LeftPanel.jsx         # country radiance/GDP stats + dual-axis chart
│   │   ├── RightPanel.jsx        # health stats + scatter + interpretation note
│   │   ├── DualAxisChart.jsx     # D3 radiance-vs-GDP time series
│   │   └── ScatterChart.jsx      # D3 radiance-vs-depression scatter
│   ├── hooks/
│   │   └── useData.js            # loads data bundle + geojson
│   ├── lib/
│   │   ├── constants.js          # variable metadata, captions, texture URLs
│   │   ├── data.js               # value lookup, color scales, formatting
│   │   └── geo.js                # lat/lon conversion, hit-testing, overlay painting
│   ├── styles/
│   │   └── global.css            # light/dark themes and all layout
│   ├── App.jsx                   # state orchestration
│   └── main.jsx                  # React entry point
├── pipeline/                     # Python data pipeline (run separately)
│   ├── merge_pipeline.py         # cleans + merges the three raw sources
│   ├── build_frontend_data.py    # produces data_bundle.json + countries.geojson
│   └── requirements.txt
├── index.html
├── vite.config.js
└── package.json
```

## Data

The visualization integrates three public datasets, all indexed by country and
year (2013–2023):

| Source | Variable | Notes |
| --- | --- | --- |
| **NASA / NOAA VIIRS** (via Google Earth Engine, VNL V2.1 + V2.2) | Mean nighttime radiance (nW/cm²/sr) | Aggregated to country level by zonal mean |
| **World Bank** | GDP per capita (current USD) | Indicator `NY.GDP.PCAP.CD` |
| **IHME Global Burden of Disease** | Depressive & anxiety disorder prevalence (rate /100k) | Used as proxies for circadian-disruption-related health |

After merging on a harmonized country/year index, **189 countries** have data;
**161** of them have clickable polygons on the globe (the rest are microstates
and small islands below the 110m geometry resolution).

Two derived variables are also computed: a **luminosity growth index** (% change
vs. the 2013 baseline) and a **luminosity-to-GDP ratio**.

### Regenerating the data

The committed `public/data` assets are ready to use. To rebuild from scratch:

```bash
cd pipeline
python -m venv venv
source venv/bin/activate.fish   # fish shell; use venv/bin/activate for bash/zsh
pip install -r requirements.txt

# 1. place the three raw CSVs in ../data/raw/ (see the acquisition notes)
# 2. merge and clean
python merge_pipeline.py
# 3. build the frontend assets
python build_frontend_data.py
```

## A note on interpretation

The health correlation is **indirect**: prevalence estimates reflect diagnosis
and reporting capacity, which track national wealth, and satellite radiance
measures upward-emitted light rather than personal exposure. The interface
states this caveat in the health panel. The goal is to make an invisible
phenomenon visible and prompt questions — not to assert causation.

## Higher-resolution Earth (optional)

The globe ships with 1k textures for fast loading. For sharper detail, download
higher-resolution equirectangular maps (e.g. from PlanetPixelEmporium or NASA
Visible Earth), place them in `public/textures/`, and point the `TEXTURES`
object in `src/lib/constants.js` at the local paths.
