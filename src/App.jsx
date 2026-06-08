import { useState, useCallback, useEffect } from 'react';
import Header from './components/Header.jsx';
import Legend from './components/Legend.jsx';
import Globe from './components/Globe.jsx';
import LeftPanel from './components/LeftPanel.jsx';
import RightPanel from './components/RightPanel.jsx';
import Timeline from './components/Timeline.jsx';
import DotField from './components/DotField.jsx';
import Landing from './components/Landing.jsx';
import { useData } from './hooks/useData.js';

export default function App() {
  const { data, geo, loading, error } = useData();
  const [year, setYear] = useState(2013);
  const [variable, setVariable] = useState(null);
  const [healthMetric] = useState('d'); // depressive rate drives the Health view
  const [selected, setSelected] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [dark, setDark] = useState(false);
  const [texLoaded, setTexLoaded] = useState(false);
  const [rightOpen, setRightOpen] = useState(true);
  const [leftOpen, setLeftOpen] = useState(true);
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
  }, [dark]);

  // Keep panels vertically centred between the legend bottom and the timeline top.
  useEffect(() => {
    const update = () => {
      const timelineEl = document.querySelector('.timeline');
      const legendEl   = document.querySelector('.legend');
      const headerEl   = document.querySelector('header');
      if (!timelineEl) return;

      const timelineTop = timelineEl.getBoundingClientRect().top;
      const topBound    = legendEl
        ? legendEl.getBoundingClientRect().bottom
        : (headerEl ? headerEl.getBoundingClientRect().bottom : 0);

      const centerY = (topBound + timelineTop) / 2;
      document.documentElement.style.setProperty('--panel-center-y', `${centerY}px`);
    };

    requestAnimationFrame(update);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [variable, data]);

  const handleYearChange = useCallback((next) => {
    setYear((prev) => (typeof next === 'function' ? next(prev) : next));
  }, []);

  const handleSelect = useCallback((name) => {
    setSelected(name);
    setRightOpen(true);
    setLeftOpen(true);
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
      {showLanding && <Landing onEnter={() => setShowLanding(false)} />}
      <div className="dot-field-wrapper">
        <DotField
          dotRadius={1.5}
          dotSpacing={20}
          bulgeStrength={60}
          glowRadius={0}
          sparkle={false}
          waveAmplitude={0}
          gradientFrom={dark ? 'rgba(232, 236, 248, 0.75)' : 'rgba(92, 101, 128, 0.62)'}
          gradientTo={dark ? 'rgba(149, 160, 190, 0.55)' : 'rgba(147, 155, 178, 0.45)'}
        />
      </div>

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

      {data && variable && <Legend domains={data.domains} variable={variable} healthMetric={healthMetric} />}

      {selected && (
        <div className="country-badge">
          <div className="country-badge-label">Selected territory</div>
          {selected}
        </div>
      )}

      {data && geo && (
        <Globe
          data={data}
          geo={geo}
          year={year}
          variable={variable}
          healthMetric={healthMetric}
          selected={selected}
          onSelect={handleSelect}
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
            open={leftOpen}
            onClose={() => setLeftOpen(false)}
          />
          <RightPanel lookup={data.lookup} country={selected} year={year} dark={dark} open={rightOpen} onClose={() => setRightOpen(false)} />
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
