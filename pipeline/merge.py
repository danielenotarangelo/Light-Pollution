import pandas as pd
import json
import numpy as np

# ── Load raw data ──────────────────────────────────────────────────────────────
viirs  = pd.read_csv('/mnt/project/viirs_country_annual_radiance.csv')
gdp    = pd.read_csv('/mnt/project/gdp_per_capita.csv')
health = pd.read_csv('/mnt/project/IHMEGBD_2023_DATA3f6187a31.csv')

# ── Standardize column names ───────────────────────────────────────────────────
viirs  = viirs.rename(columns={'country_na': 'country'})
health = health.rename(columns={'location': 'country'})

# ── Name harmonization maps ────────────────────────────────────────────────────
# Map VIIRS names → standard name
viirs_map = {
    'Antigua & Barbuda':            'Antigua and Barbuda',
    'Bahamas, The':                 'Bahamas',
    'Bolivia':                      'Bolivia (Plurinational State of)',
    'Bosnia & Herzegovina':         'Bosnia and Herzegovina',
    'Brunei':                       'Brunei Darussalam',
    'Burma':                        'Myanmar',
    'Central African Rep':          'Central African Republic',
    'Cote d\'Ivoire':               "Côte d'Ivoire",
    'Dem Rep of the Congo':         'Democratic Republic of the Congo',
    'Congo':                        'Congo',
    'Fed States of Micronesia':     'Micronesia (Federated States of)',
    'Gambia, The':                  'Gambia',
    'Iran':                         'Iran (Islamic Republic of)',
    'Kosovo':                       'Kosovo',
    'Laos':                         "Lao People's Democratic Republic",
    'Macedonia':                    'North Macedonia',
    'Moldova':                      'Republic of Moldova',
    'Korea, North':                 "Democratic People's Republic of Korea",
    'Russia':                       'Russian Federation',
    'Saint Kitts & Nevis':          'Saint Kitts and Nevis',
    'Saint Vincent & Grenadines':   'Saint Vincent and the Grenadines',
    'Sao Tome & Principe':          'Sao Tome and Principe',
    'Korea, South':                 'South Korea',
    'Syria':                        'Syrian Arab Republic',
    'Tanzania':                     'United Republic of Tanzania',
    'Trinidad & Tobago':            'Trinidad and Tobago',
    'Turkey':                       'Türkiye',
    'United States':                'United States of America',
    'Venezuela':                    'Venezuela (Bolivarian Republic of)',
    'Vietnam':                      'Viet Nam',
    'West Bank':                    'Palestine',
    'Eswatini':                     'Eswatini',
    'Cook Is':                      'Cook Islands',
    'Marshall Is':                  'Marshall Islands',
    'N. Mariana Is':                'Northern Mariana Islands',
    'Solomon Is':                   'Solomon Islands',
    'Sao Tome & Principe':          'Sao Tome and Principe',
    'US Virgin Is':                 'United States Virgin Islands',
}

# Map GDP names → standard name
gdp_map = {
    'Bahamas, The':                 'Bahamas',
    'Bolivia':                      'Bolivia (Plurinational State of)',
    'Congo, Dem. Rep.':             'Democratic Republic of the Congo',
    'Congo, Rep.':                  'Congo',
    "Cote d'Ivoire":                "Côte d'Ivoire",
    'Egypt, Arab Rep.':             'Egypt',
    'Gambia, The':                  'Gambia',
    'Iran, Islamic Rep.':           'Iran (Islamic Republic of)',
    'Korea, Dem. People\'s Rep.':   "Democratic People's Republic of Korea",
    'Korea, Rep.':                  'South Korea',
    'Kyrgyz Republic':              'Kyrgyzstan',
    'Lao PDR':                      "Lao People's Democratic Republic",
    'Micronesia, Fed. Sts.':        'Micronesia (Federated States of)',
    'Moldova':                      'Republic of Moldova',
    'Russian Federation':           'Russian Federation',
    'Slovak Republic':              'Slovakia',
    'St. Kitts and Nevis':          'Saint Kitts and Nevis',
    'St. Lucia':                    'Saint Lucia',
    'St. Vincent and the Grenadines': 'Saint Vincent and the Grenadines',
    'Syrian Arab Republic':         'Syrian Arab Republic',
    'Tanzania':                     'United Republic of Tanzania',
    'Turkiye':                      'Türkiye',
    'United States':                'United States of America',
    'Venezuela, RB':                'Venezuela (Bolivarian Republic of)',
    'Viet Nam':                     'Viet Nam',
    'West Bank and Gaza':           'Palestine',
    'Yemen, Rep.':                  'Yemen',
    'Eritrea':                      'Eritrea',
    'Somalia':                      'Somalia',
}

# Apply mappings
viirs['country']  = viirs['country'].replace(viirs_map)
gdp['country']    = gdp['country'].replace(gdp_map)

# ── Drop null radiance rows ────────────────────────────────────────────────────
viirs = viirs.dropna(subset=['mean_radiance'])

# ── Pivot health: one row per country/year with both causes as columns ─────────
health_pivot = health.pivot_table(
    index=['country', 'year'],
    columns='cause',
    values='val',
    aggfunc='first'
).reset_index()
health_pivot.columns.name = None
health_pivot = health_pivot.rename(columns={
    'Depressive disorders': 'depressive_rate',
    'Anxiety disorders':    'anxiety_rate'
})

# ── Remove World Bank regional aggregates from GDP ────────────────────────────
# Keep only rows that appear in IHME (which only has real countries)
ihme_countries = set(health['country'].unique())
gdp = gdp[gdp['country'].isin(ihme_countries) | gdp['country'].isin(set(viirs['country'].unique()))]

# ── Merge all three on country + year ─────────────────────────────────────────
df = viirs.merge(gdp,          on=['country', 'year'], how='inner')
df = df.merge(health_pivot,    on=['country', 'year'], how='inner')

print(f'Merged shape: {df.shape}')
print(f'Unique countries: {df["country"].nunique()}')
print(f'Years: {sorted(df["year"].unique())}')
print(f'Null values:\n{df.isnull().sum()}')
print(f'\nSample:\n{df.head(10)}')

# ── Compute derived variables ──────────────────────────────────────────────────
# Luminosity growth index: % change vs 2013 baseline
baseline = df[df['year'] == 2013][['country', 'mean_radiance']].rename(
    columns={'mean_radiance': 'radiance_2013'}
)
df = df.merge(baseline, on='country', how='left')
df['luminosity_growth_index'] = (
    (df['mean_radiance'] - df['radiance_2013']) / df['radiance_2013'] * 100
).round(2)
df = df.drop(columns=['radiance_2013'])

# Luminosity-to-GDP ratio
df['luminosity_gdp_ratio'] = (df['mean_radiance'] / df['gdp_per_capita']).round(6)

# ── Round floats for JSON size ─────────────────────────────────────────────────
df['mean_radiance']      = df['mean_radiance'].round(6)
df['gdp_per_capita']     = df['gdp_per_capita'].round(2)
df['depressive_rate']    = df['depressive_rate'].round(2)
df['anxiety_rate']       = df['anxiety_rate'].round(2)

# ── Export flat CSV ────────────────────────────────────────────────────────────
df.to_csv('/home/claude/master_dataset.csv', index=False)
print(f'\nCSV saved: {df.shape[0]} rows, {df.shape[1]} columns')

# ── Export nested JSON for React ───────────────────────────────────────────────
# Structure: list of country objects, each with a timeseries array
countries_json = []
for country, group in df.groupby('country'):
    group_sorted = group.sort_values('year')
    entry = {
        'country': country,
        'timeseries': group_sorted[[
            'year', 'mean_radiance', 'gdp_per_capita',
            'depressive_rate', 'anxiety_rate',
            'luminosity_growth_index', 'luminosity_gdp_ratio'
        ]].to_dict(orient='records')
    }
    countries_json.append(entry)

with open('/home/claude/master_dataset.json', 'w') as f:
    json.dump(countries_json, f, indent=2)

print(f'JSON saved: {len(countries_json)} countries')
print(f'\nSample entry:')
print(json.dumps(countries_json[0], indent=2))
