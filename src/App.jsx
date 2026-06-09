import { useState, useCallback, useEffect } from 'react';
import Header from './components/Header.jsx';
import Legend from './components/Legend.jsx';
import Globe from './components/Globe.jsx';
import LeftPanel from './components/LeftPanel.jsx';
import RightPanel from './components/RightPanel.jsx';
import LGIPanel from './components/LGIPanel.jsx';
import LGRPanel from './components/LGRPanel.jsx';
import LGIHealthPanel from './components/LGIHealthPanel.jsx';
import GDPHealthPanel from './components/GDPHealthPanel.jsx';
import Stack from './components/Stack.jsx';
import Timeline from './components/Timeline.jsx';
import DotField from './components/DotField.jsx';
import Galaxy from './components/Galaxy.jsx';
import Landing from './components/Landing.jsx';
import { useData } from './hooks/useData.js';

export default function App() {
  const { data, geo, loading, error } = useData();
  const [year, setYear] = useState(2013);
  const [variable, setVariable] = useState(null);
  const [healthMetric] = useState('d');
  const [selected, setSelected] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [dark, setDark] = useState(false);
  const [texLoaded, setTexLoaded] = useState(false);
  const [rightOpen, setRightOpen] = useState(true);
  const [leftOpen, setLeftOpen] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  const [isSmallPhone, setIsSmallPhone] = useState(() => window.innerWidth <= 400);

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth <= 640);
      setIsSmallPhone(window.innerWidth <= 400);
    };
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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
    const maxPanelH = Math.max(200, timelineTop - topBound - 40);
    document.documentElement.style.setProperty('--panel-center-y', `${centerY}px`);
    document.documentElement.style.setProperty('--panel-max-height', `${maxPanelH}px`);
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

  const mobileBg = dark ? '#0d101c' : '#f8f9fc';

  return (
    <div className="app">
      {showLanding && <Landing onEnter={() => setShowLanding(false)} />}
      <div className="dot-field-wrapper">
        {dark ? (
          <Galaxy
            mouseInteraction={false}
            mouseRepulsion={false}
            density={1.5}
            glowIntensity={0.15}
            saturation={0.15}
            hueShift={210}
            twinkleIntensity={0.2}
            rotationSpeed={0.003}
            speed={0.12}
            starSpeed={0.12}
            transparent={true}
          />
        ) : (
          <DotField
            dotRadius={1.5}
            dotSpacing={20}
            bulgeStrength={60}
            glowRadius={0}
            sparkle={false}
            waveAmplitude={0}
            gradientFrom="rgba(92, 101, 128, 0.62)"
            gradientTo="rgba(147, 155, 178, 0.45)"
          />
        )}
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

      {data && variable && !(isSmallPhone && selected) && <Legend domains={data.domains} variable={variable} healthMetric={healthMetric} />}

      {selected && !isSmallPhone && (
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
        isMobile ? (
          selected && (
            <>
              <div className="mobile-backdrop" onClick={() => setSelected(null)} />
              <div className="mobile-stack-wrapper">
              <Stack
                sendToBackOnClick
                sensitivity={180}
                cards={[
                  <LeftPanel key="left" lookup={data.lookup} country={selected} year={year} dark={dark} inStack compact bgColor={mobileBg} />,
                  <LGIPanel key="lgi" lookup={data.lookup} country={selected} year={year} dark={dark} inStack compact bgColor={mobileBg} />,
                  <LGIHealthPanel key="lgi-health" lookup={data.lookup} country={selected} year={year} healthMetric={healthMetric} dark={dark} inStack compact bgColor={mobileBg} />,
                  <RightPanel key="right" lookup={data.lookup} country={selected} year={year} dark={dark} inStack compact bgColor={mobileBg} />,
                  <LGRPanel key="lgr" lookup={data.lookup} country={selected} year={year} dark={dark} inStack compact bgColor={mobileBg} />,
                  <GDPHealthPanel key="gdp-health" lookup={data.lookup} country={selected} year={year} healthMetric={healthMetric} dark={dark} inStack compact bgColor={mobileBg} />,
                ]}
              />
              </div>
            </>
          )
        ) : (
          <>
            <div className={`desktop-stack-left${selected && leftOpen ? ' visible' : ''}`}>
              <Stack
                key={`left-${selected}`}
                sendToBackOnClick
                sensitivity={180}
                cards={[
                  <LeftPanel key="left" lookup={data.lookup} country={selected} year={year} dark={dark} inStack onClose={() => setLeftOpen(false)} />,
                  <LGIPanel key="lgi" lookup={data.lookup} country={selected} year={year} dark={dark} inStack onClose={() => setLeftOpen(false)} />,
                  <LGIHealthPanel key="lgi-health" lookup={data.lookup} country={selected} year={year} healthMetric={healthMetric} dark={dark} inStack onClose={() => setLeftOpen(false)} />,
                ]}
              />
            </div>
            <div className={`desktop-stack-right${selected && rightOpen ? ' visible' : ''}`}>
              <Stack
                key={`right-${selected}`}
                sendToBackOnClick
                sensitivity={180}
                cards={[
                  <RightPanel key="right" lookup={data.lookup} country={selected} year={year} dark={dark} inStack onClose={() => setRightOpen(false)} />,
                  <LGRPanel key="lgr" lookup={data.lookup} country={selected} year={year} dark={dark} inStack onClose={() => setRightOpen(false)} />,
                  <GDPHealthPanel key="gdp-health" lookup={data.lookup} country={selected} year={year} healthMetric={healthMetric} dark={dark} inStack onClose={() => setRightOpen(false)} />,
                ]}
              />
            </div>
          </>
        )
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
