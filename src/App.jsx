import { useState, useCallback, useEffect } from 'react';
import Header from './components/Header.jsx';
import Legend from './components/Legend.jsx';
import Globe from './components/Globe.jsx';
import LeftPanel from './components/LeftPanel.jsx';
import RightPanel from './components/RightPanel.jsx';
import Timeline from './components/Timeline.jsx';
import { useData } from './hooks/useData.js';

export default function App() {
  const { data, geo, loading, error } = useData();
  const [year, setYear] = useState(2013);
  const [variable, setVariable] = useState('r');
  const [healthMetric] = useState('d'); // depressive rate drives the Health view
  const [selected, setSelected] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [dark, setDark] = useState(false);
  const [texLoaded, setTexLoaded] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
  }, [dark]);

  const handleYearChange = useCallback((next) => {
    setYear((prev) => (typeof next === 'function' ? next(prev) : next));
  }, []);

  if (error) {
    return (
      <div className="fatal">
        <p>Could not load data. Make sure the files exist in <code>/public/data</code>.</p>
      </div>
    );
  }

  return (
    <div className="app">
      {(loading || !texLoaded) && (
        <div className={`loading${loading ? '' : ' hidden'}`}>
          <div className="spin" />
        </div>
      )}

      <Header
        variable={variable}
        onVariableChange={setVariable}
        dark={dark}
        onToggleTheme={() => setDark((d) => !d)}
      />

      {data && <Legend domains={data.domains} variable={variable} healthMetric={healthMetric} />}

      {data && geo && (
        <Globe
          data={data}
          geo={geo}
          year={year}
          variable={variable}
          healthMetric={healthMetric}
          selected={selected}
          onSelect={setSelected}
          onTexturesLoaded={() => setTexLoaded(true)}
        />
      )}

      {data && (
        <>
          <LeftPanel
            lookup={data.lookup}
            country={selected}
            year={year}
            dark={dark}
            onClose={() => setSelected(null)}
          />
          <RightPanel lookup={data.lookup} country={selected} year={year} dark={dark} />
        </>
      )}

      {!selected && <div className="hint">Drag to rotate · scroll to zoom · click a country</div>}

      <Timeline
        year={year}
        onYearChange={handleYearChange}
        playing={playing}
        onTogglePlay={() => setPlaying((p) => !p)}
      />
    </div>
  );
}
