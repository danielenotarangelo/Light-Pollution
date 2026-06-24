import wbdata
import pandas as pd

# GDP per capita (current USD)
indicators = {"NY.GDP.PCAP.CD": "gdp_per_capita"}

# Fetch for all countries, 2013–2023
df = wbdata.get_dataframe(
    indicators,
    date=("2013", "2023")
)

df = df.reset_index()
df.columns = ["country", "year", "gdp_per_capita"]

# Convert year to integer
df["year"] = pd.to_numeric(df["year"], errors="coerce").astype("Int64")

# Drop nulls
df = df[df["gdp_per_capita"].notna()]

print(f"Shape: {df.shape}")
print(f"Years: {sorted(df['year'].unique())}")
print(f"Sample:\n{df.head(10)}")

df.to_csv("../data/raw/gdp_per_capita.csv", index=False)
print("\nSaved to ../data/raw/gdp_per_capita.csv")