"""
enrich_dataset.py
-----------------
Reads the existing master_dataset.csv, fetches energy consumption and
urbanization rate from the World Bank REST API, merges them, and saves
an updated master_dataset.csv + master_dataset.json.

Run from the project root or pipeline/ folder:
    python3 pipeline/enrich_dataset.py
"""

import json
import math
import os
import urllib.request

import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DATA = os.path.join(HERE, '..', 'public', 'data')
MASTER_CSV = os.path.join(PUBLIC_DATA, 'master_dataset.csv')

WB_NAME_MAP = {
    "Bahamas, The":                   "Bahamas",
    "Bolivia":                        "Bolivia (Plurinational State of)",
    "Congo, Dem. Rep.":               "Democratic Republic of the Congo",
    "Congo, Rep.":                    "Congo",
    "Cote d'Ivoire":                  "Côte d'Ivoire",
    "Egypt, Arab Rep.":               "Egypt",
    "Gambia, The":                    "Gambia",
    "Iran, Islamic Rep.":             "Iran (Islamic Republic of)",
    "Korea, Dem. People's Rep.":      "Democratic People's Republic of Korea",
    "Korea, Rep.":                    "Republic of Korea",
    "Kyrgyz Republic":                "Kyrgyzstan",
    "Lao PDR":                        "Lao People's Democratic Republic",
    "Micronesia, Fed. Sts.":          "Micronesia (Federated States of)",
    "Moldova":                        "Republic of Moldova",
    "Russian Federation":             "Russian Federation",
    "Slovak Republic":                "Slovakia",
    "St. Kitts and Nevis":            "Saint Kitts and Nevis",
    "St. Lucia":                      "Saint Lucia",
    "St. Vincent and the Grenadines": "Saint Vincent and the Grenadines",
    "Syrian Arab Republic":           "Syrian Arab Republic",
    "Tanzania":                       "United Republic of Tanzania",
    "Turkiye":                        "Türkiye",
    "Türkiye":                        "Türkiye",
    "United States":                  "United States of America",
    "Venezuela, RB":                  "Venezuela (Bolivarian Republic of)",
    "Viet Nam":                       "Viet Nam",
    "West Bank and Gaza":             "Palestine",
    "Yemen, Rep.":                    "Yemen",
    "Brunei Darussalam":              "Brunei Darussalam",
    "North Macedonia":                "North Macedonia",
    "Eswatini":                       "Eswatini",
    "Myanmar":                        "Myanmar",
    "Czechia":                        "Czech Republic",
}


def fetch_wb(indicator, label):
    """Fetch all years 2012-2023 for a WB indicator. Returns a DataFrame."""
    url = (
        f"https://api.worldbank.org/v2/country/all/indicator/{indicator}"
        f"?format=json&per_page=20000&date=2012:2023"
    )
    print(f"  Fetching {label} ({indicator})...")
    with urllib.request.urlopen(url, timeout=30) as resp:
        raw = json.loads(resp.read())

    records = raw[1] or []
    rows = []
    for r in records:
        if r["value"] is None:
            continue
        iso3 = r.get("countryiso3code", "")
        # Skip aggregates (they don't have a standard 3-letter ISO code or
        # the country dict id is a 2-letter region code)
        if len(iso3) != 3:
            continue
        rows.append({
            "country": r["country"]["value"],
            "year": int(r["date"]),
            label: round(float(r["value"]), 4),
        })

    df = pd.DataFrame(rows)
    df["country"] = df["country"].replace(WB_NAME_MAP)
    print(f"    {len(df)} non-null rows, {df['country'].nunique()} countries")
    return df


def safe(v):
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return None
    return v


def main():
    print("Reading master_dataset.csv...")
    df = pd.read_csv(MASTER_CSV)
    print(f"  {df.shape[0]} rows, columns: {list(df.columns)}")

    energy = fetch_wb("EG.USE.ELEC.KH.PC", "energy_kwh_pc")
    urban  = fetch_wb("SP.URB.TOTL.IN.ZS",  "urban_pct")

    df = df.merge(energy, on=["country", "year"], how="left")
    df = df.merge(urban,  on=["country", "year"], how="left")

    e_filled = df["energy_kwh_pc"].notna().sum()
    u_filled = df["urban_pct"].notna().sum()
    total = len(df)
    print(f"\nCoverage — energy: {e_filled}/{total} ({100*e_filled//total}%)"
          f"  urban: {u_filled}/{total} ({100*u_filled//total}%)")

    # ── Save updated CSV ──────────────────────────────────────────────────────
    df.to_csv(MASTER_CSV, index=False)
    print(f"\nUpdated CSV saved ({df.shape[1]} columns)")

    # ── Save nested JSON ──────────────────────────────────────────────────────
    out = []
    cols = [
        "year", "mean_radiance", "gdp_per_capita",
        "depressive_rate", "anxiety_rate",
        "luminosity_growth_index", "luminosity_gdp_ratio",
        "energy_kwh_pc", "urban_pct",
    ]
    for country, group in df.groupby("country"):
        out.append({
            "country": country,
            "timeseries": group.sort_values("year")[cols].to_dict(orient="records"),
        })

    json_path = os.path.join(PUBLIC_DATA, "master_dataset.json")
    with open(json_path, "w") as f:
        json.dump(out, f, indent=2, default=safe)
    print(f"Updated JSON saved ({len(out)} countries)")


if __name__ == "__main__":
    main()
