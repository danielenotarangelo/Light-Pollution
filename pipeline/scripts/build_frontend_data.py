"""
build_frontend_data.py
-----------------------
Transforms the merged master_dataset into the two assets the React app
consumes from /public/data:

  1. data_bundle.json   compact { lookup, domains, years } used for all
                        values, color scales, charts.
  2. countries.geojson  simplified country polygons matched to the
                        dataset's country names, used by the globe.

Run AFTER merge_pipeline.py. Requires the master_dataset and a Natural
Earth 110m countries GeoJSON (downloaded automatically if missing).

    python build_frontend_data.py
"""

import json
import os
import urllib.request
import ssl
import pandas as pd
import geopandas as gpd

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DATA = os.path.join(HERE, '..', 'public', 'data')
MASTER_CSV = os.path.join(PUBLIC_DATA, 'master_dataset.csv')
NE_PATH = os.path.join(HERE, 'ne_110m_admin_0_countries.geojson')
NE_URL = (
    'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/'
    'master/geojson/ne_110m_admin_0_countries.geojson'
)

# Map Natural Earth admin names → dataset (IHME-style) names.
NE_TO_DATA = {
    'United States of America': 'United States of America',
    'Tanzania': 'United Republic of Tanzania',
    'Republic of the Congo': 'Congo',
    'Iran': 'Iran (Islamic Republic of)',
    'Laos': "Lao People's Democratic Republic",
    'Vietnam': 'Viet Nam',
    'South Korea': 'South Korea',
    'North Korea': "Democratic People's Republic of Korea",
    'Moldova': 'Republic of Moldova',
    'Russia': 'Russian Federation',
    'Syria': 'Syrian Arab Republic',
    'Brunei': 'Brunei Darussalam',
    'Bolivia': 'Bolivia (Plurinational State of)',
    'Venezuela': 'Venezuela (Bolivarian Republic of)',
    'Turkey': 'Türkiye',
    'Ivory Coast': "Côte d'Ivoire",
    'eSwatini': 'Eswatini',
    'The Bahamas': 'Bahamas',
    'Somalia': 'Somalia',
    'Republic of Serbia': 'Serbia',
}


def download_ne():
    if os.path.exists(NE_PATH):
        return
    print('Downloading Natural Earth 110m countries...')
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(NE_URL, headers={'User-Agent': 'Mozilla/5.0'})
    data = urllib.request.urlopen(req, context=ctx, timeout=60).read()
    with open(NE_PATH, 'wb') as f:
        f.write(data)
    print('  saved', NE_PATH)


def _safe(val):
    import math
    if val is None:
        return None
    try:
        return None if math.isnan(float(val)) else val
    except (TypeError, ValueError):
        return None


def build_bundle(df):
    lookup = {}
    for country, group in df.groupby('country'):
        lookup[country] = {}
        for _, row in group.iterrows():
            entry = {
                'r':   round(float(row['mean_radiance']), 6),
                'g':   round(float(row['gdp_per_capita']), 2),
                'd':   round(float(row['depressive_rate']), 2),
                'a':   round(float(row['anxiety_rate']), 2),
                'lgi': round(float(row['luminosity_growth_index']), 2),
                'lgr': round(float(row['luminosity_gdp_ratio']), 6),
            }
            if 'energy_kwh_pc' in row and _safe(row['energy_kwh_pc']) is not None:
                entry['e'] = round(float(row['energy_kwh_pc']), 1)
            if 'urban_pct' in row and _safe(row['urban_pct']) is not None:
                entry['u'] = round(float(row['urban_pct']), 2)
            lookup[country][int(row['year'])] = entry

    domains = {}
    for var, col in [('r', 'mean_radiance'), ('g', 'gdp_per_capita'),
                     ('d', 'depressive_rate'), ('a', 'anxiety_rate')]:
        domains[var] = {
            'min': float(df[col].quantile(0.02)),
            'max': float(df[col].quantile(0.98)),
        }
    for var, col in [('e', 'energy_kwh_pc'), ('u', 'urban_pct')]:
        if col in df.columns:
            clean = df[col].dropna()
            if len(clean) > 0:
                domains[var] = {
                    'min': float(clean.quantile(0.02)),
                    'max': float(clean.quantile(0.98)),
                }

    years = sorted(int(y) for y in df['year'].unique())
    return {'lookup': lookup, 'domains': domains, 'years': years}


def build_geojson(df):
    gdf = gpd.read_file(NE_PATH)
    data_countries = set(df['country'].unique())

    def resolve(row):
        admin = row['ADMIN']
        if admin in NE_TO_DATA and NE_TO_DATA[admin] in data_countries:
            return NE_TO_DATA[admin]
        for col in ['ADMIN', 'NAME_LONG', 'NAME']:
            if row[col] in data_countries:
                return row[col]
        return None

    gdf['data_name'] = gdf.apply(resolve, axis=1)
    matched = gdf[gdf['data_name'].notna()].copy()
    matched['geometry'] = matched['geometry'].simplify(0.3, preserve_topology=True)
    out = matched[['data_name', 'geometry']].rename(columns={'data_name': 'name'})
    print(f'  matched {len(out)} / {len(gdf)} geometries to dataset')
    return json.loads(out.to_json())


def main():
    df = pd.read_csv(MASTER_CSV)
    os.makedirs(PUBLIC_DATA, exist_ok=True)

    print('Building data_bundle.json...')
    bundle = build_bundle(df)
    with open(os.path.join(PUBLIC_DATA, 'data_bundle.json'), 'w') as f:
        json.dump(bundle, f, separators=(',', ':'))
    print(f'  {len(bundle["lookup"])} countries')

    download_ne()
    print('Building countries.geojson...')
    geo = build_geojson(df)
    with open(os.path.join(PUBLIC_DATA, 'countries.geojson'), 'w') as f:
        json.dump(geo, f, separators=(',', ':'))

    print('Done. Frontend assets written to public/data/')


if __name__ == '__main__':
    main()
