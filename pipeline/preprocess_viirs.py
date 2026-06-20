"""
Convert viirs_points_<year>.csv → viirs_points_<year>.bin (Float32: lon, lat, radiance × N)

Thresholds by |lat| band (symmetric, same for both hemispheres):
  |lat| ≤ 48°  → 0.7  nW   (tropics, mid-latitudes, Australia)
  |lat| ≤ 62°  → 1.5  nW   (N/S Europe, Scandinavia, tip of S. America)
  |lat| ≤ 70°  → 4.0  nW   (sub-polar)
  > 70°         → 8.0  nW   (polar — strong aurora filter)
  lat limit:  ±75° (hard cutoff)

Usage:
  python3 pipeline/preprocess_viirs.py           → processes all years 2013-2023
  python3 pipeline/preprocess_viirs.py 2019      → single year
"""
import csv, struct, json, sys, os, shutil

RAW_DIR  = "public/data/raw/viirs"
OUT_DIR  = "public/data"
DIST_DIR = "dist/data"

LAT_LIMIT = 75.0
YEARS     = list(range(2013, 2024))

def threshold(lat):
    alat = abs(lat)
    if alat <= 48: return 0.7
    if alat <= 62: return 1.5
    if alat <= 70: return 4.0
    return 8.0

def process_year(yr):
    raw = os.path.join(RAW_DIR, f"viirs_points_{yr}.csv")
    out = os.path.join(OUT_DIR, f"viirs_points_{yr}.bin")

    if not os.path.exists(raw):
        print(f"  {yr}: missing {raw}, skip")
        return

    kept = []
    total = 0
    with open(raw, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total += 1
            try:
                rad = float(row["avg_rad"])
                geo = json.loads(row[".geo"])
                lon, lat = geo["coordinates"]
            except Exception:
                continue
            if abs(lat) > LAT_LIMIT:
                continue
            if rad < threshold(lat):
                continue
            kept.append((float(lon), float(lat), float(rad)))

    buf = bytearray()
    for lon, lat, rad in kept:
        buf += struct.pack("<fff", lon, lat, rad)

    with open(out, "wb") as f:
        f.write(buf)

    # Mirror to dist/ if it exists
    dist_out = os.path.join(DIST_DIR, f"viirs_points_{yr}.bin")
    if os.path.isdir(DIST_DIR):
        shutil.copy(out, dist_out)
        extra = f"  → {dist_out}"
    else:
        extra = ""

    print(f"  {yr}: kept {len(kept):>5} / {total} pts  →  {out} ({len(buf)//1024} KB){extra}")

if __name__ == "__main__":
    target_years = [int(sys.argv[1])] if len(sys.argv) > 1 else YEARS
    print(f"Processing {target_years[0]}–{target_years[-1]} …")
    for yr in target_years:
        process_year(yr)
    print("Done.")
