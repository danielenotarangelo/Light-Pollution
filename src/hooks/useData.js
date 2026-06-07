import { useState, useEffect } from 'react';

// Loads the data bundle (lookup + domains) and the country geometries
// from /public/data. Returns { data, geo, loading, error }.
export function useData() {
  const [data, setData] = useState(null);
  const [geo, setGeo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/data_bundle.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/countries.geojson`).then((r) => r.json()),
    ])
      .then(([bundle, geojson]) => {
        if (cancelled) return;
        setData(bundle);
        setGeo(geojson);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, geo, loading, error };
}
