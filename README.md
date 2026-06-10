# Nights of Light

An interactive data visualization exploring the relationship between **artificial light at night**, **economic development**, and **mental health** across the world from 2013 to 2023.

Built for the Data Visualization Lab exam at the University of Trento. The centerpiece is a realistic 3D globe — click any country to open a set of panels that show how its light pollution, wealth, and health metrics evolved over the decade. A timeline slider lets you scrub through the years; three toggles re-encode the globe by light, wealth, or health.

---

## Running it locally

You need [Node.js](https://nodejs.org/) (v18 or later).

```bash
# 1. Clone the repo and enter the directory
git clone <repo-url>
cd Light-Pollution

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

> The Earth textures are loaded from a CDN (jsDelivr), so the first load requires an internet connection. If a texture fails to load, the globe automatically falls back to a Blue Marble image.

To build a production bundle:

```bash
npm run build
npm run preview   # serves the built files locally
```

---

## What you're looking at

When you click a country, two stacks of panels appear:

**Left stack**
- **Light & Wealth** — a dual-axis chart of mean radiance and GDP per capita over time
- **Luminosity Growth** — how the country's light output changed relative to its 2013 baseline

**Right stack**
- **Light-to-GDP Ratio** — radiance relative to economic output (a rough efficiency indicator)
- **Global Position** — a quadrant chart placing the country against all others for the selected year
- **Trajectory** — how light pollution and mental health shifted together year by year

---

## Tech stack

- **React 18 + Vite** — UI and build tooling
- **Three.js** — 3D Earth with satellite texture, specular oceans, atmospheric clouds, and a starfield
- **D3** — choropleth coloring, color scales, and all panel charts
- **Python** (separate pipeline) — data acquisition, cleaning, merging, and asset generation

---

## Data sources

The visualization merges three public datasets, all indexed by country and year (2013–2023):

| Source | Variable | Notes |
|--------|----------|-------|
| **NASA / NOAA VIIRS** via Google Earth Engine (VNL V2.1 + V2.2) | Mean nighttime radiance (nW/cm²/sr) | Aggregated to country level by zonal mean |
| **World Bank** | GDP per capita (current USD) | Indicator `NY.GDP.PCAP.CD` |
| **IHME Global Burden of Disease** | Depressive & anxiety disorder prevalence (rate per 100k) | See caveat below |

After merging on a harmonized country/year index, **189 countries** have at least partial data; **161** of them have clickable polygons on the globe (the remainder are microstates and small islands below the geometry resolution threshold).

Two derived variables are also computed: a **luminosity growth index** (% change vs. the 2013 baseline) and a **luminosity-to-GDP ratio**.

### A note on the health data

The IHME figures for depressive and anxiety disorder prevalence should be treated as rough indicators, not ground truth. A few reasons to be cautious:

- **Reporting capacity varies enormously.** Countries with stronger healthcare systems and better psychiatric infrastructure tend to record — and therefore "have" — more diagnosed cases. Higher prevalence can reflect better detection, not worse health.
- **Stigma and access distort the numbers.** In many regions, mental health conditions go undiagnosed or unreported due to cultural stigma, lack of specialists, or limited data infrastructure.
- **The link to light pollution is indirect.** Satellite radiance measures upward-emitted light from above the clouds, not personal exposure. The biological pathway (light → circadian disruption → mental health) is plausible and studied, but the aggregate country-level correlation shown here cannot establish causation.

The goal of including health data is to prompt questions and make visible a phenomenon that is otherwise invisible — not to assert that brighter skies cause higher rates of depression or anxiety.

### Regenerating the data

The committed `public/data/` assets are ready to use as-is. To rebuild them from raw sources:

```bash
cd pipeline
python -m venv venv
source venv/bin/activate.fish   # fish shell — use venv/bin/activate for bash/zsh
pip install -r requirements.txt

# Place the three raw CSVs in ../data/raw/ (see acquisition notes in the pipeline scripts)
python merge_pipeline.py          # clean and merge
python build_frontend_data.py     # produce data_bundle.json + countries.geojson
```

---

## Higher-resolution Earth textures (optional)

The globe ships with 1k textures for fast loading. For sharper detail, download higher-resolution equirectangular maps (e.g. from NASA Visible Earth or PlanetPixelEmporium), place them in `public/textures/`, and update the `TEXTURES` object in `src/lib/constants.js` to point at the local paths.
