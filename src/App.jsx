import { useState, useCallback, useEffect } from 'react';
import Header from './components/Header.jsx';
import Legend from './components/Legend.jsx';
import Globe from './components/Globe.jsx';
import LeftPanel from './components/LeftPanel.jsx';
import LGIPanel from './components/LGIPanel.jsx';
import LGRPanel from './components/LGRPanel.jsx';
import QuadrantPanel from './components/QuadrantPanel.jsx';
import TrajectoryPanel from './components/TrajectoryPanel.jsx';
import RightPanel from './components/RightPanel.jsx';
import GlobalRankingPanel from './components/GlobalRankingPanel.jsx';
import OverviewBar from './components/OverviewBar.jsx';
import Stack from './components/Stack.jsx';
import Timeline from './components/Timeline.jsx';
import DotField from './components/DotField.jsx';
import Galaxy from './components/Galaxy.jsx';
import Landing from './components/Landing.jsx';
import { AnimatePresence } from 'motion/react';
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
  const [showLanding, setShowLanding] = useState(true);
  const [showRanking, setShowRanking] = useState(false);
  const [flyTo, setFlyTo] = useState(null);
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

      const centerY    = (topBound + timelineTop) / 2;
      const maxPanelH  = Math.max(200, timelineTop - topBound - 40);
      const legendBot  = legendEl ? legendEl.getBoundingClientRect().bottom : topBound;

      document.documentElement.style.setProperty('--panel-center-y',  `${centerY}px`);
      document.documentElement.style.setProperty('--panel-max-height', `${maxPanelH}px`);
      document.documentElement.style.setProperty('--legend-bottom',    `${legendBot}px`);
      document.documentElement.style.setProperty('--timeline-top',     `${timelineTop}px`);
    };

    requestAnimationFrame(update);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [variable, data]);

  // Shift globe right only when ranking panel is open without a selection
  useEffect(() => {
    if (isMobile) return;
    const rankingOpen = !selected && showRanking;
    document.documentElement.style.setProperty('--globe-shift', rankingOpen ? '150px' : '0px');
    document.documentElement.style.setProperty('--scene-left', rankingOpen ? '420px' : '0px');
  }, [selected, showRanking, isMobile]);

  const handleYearChange = useCallback((next) => {
    setYear((prev) => (typeof next === 'function' ? next(prev) : next));
  }, []);

  const handleSelect = useCallback((name) => {
    setSelected(name);
  }, []);

  const handleSearchSelect = useCallback((name) => {
    setSelected(name);
    setFlyTo(name);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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

      {data && <Legend domains={data.domains} variable={variable || 'r'} healthMetric={healthMetric} hidden={!variable || !!(isSmallPhone && selected)} />}

      {/* Centered country badge — desktop only, between the two panels */}
      {selected && !isMobile && (
        <div className="country-badge-center">
          <div className="country-badge-center-info">
            <span className="country-badge-center-label">Selected territory</span>
            <span className="country-badge-center-name">{selected}</span>
          </div>
          <button className="close-x" onClick={() => setSelected(null)}>✕</button>
        </div>
      )}

      {/* Mobile: keep the original top-right badge */}
      {selected && !isSmallPhone && isMobile && (
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
          zoomMult={selected ? 1 : (showRanking ? 0.88 : 0.95)}
          flyTo={flyTo}
        />
      )}

      {/* Search + mode tabs — shown when no country is selected */}
      <AnimatePresence>
        {data && !selected && !isMobile && (
          <OverviewBar
            key="overview-bar"
            countries={Object.keys(data.lookup)}
            onSelect={handleSearchSelect}
            showRanking={showRanking}
            onToggleRanking={() => setShowRanking(r => !r)}
          />
        )}
      </AnimatePresence>

      {/* Ranking panel — visible when Rankings tab is active and no country selected */}
      {data && !isMobile && (
        <GlobalRankingPanel
          lookup={data.lookup}
          year={year}
          dark={dark}
          visible={!selected && showRanking}
          onSelect={handleSearchSelect}
        />
      )}

      {data && !isMobile && (
        <div className={`left-light-panel${selected ? ' visible' : ''}`}>
          <LGIPanel lookup={data.lookup} country={selected} year={year} dark={dark} inStack={true} />
        </div>
      )}

      {data && (() => {
        const sharedMob = { lookup: data.lookup, country: selected, year, dark, healthMetric, inStack: true, compact: true, bgColor: mobileBg };
        const mobileCards = [
          <LeftPanel       key="left"       {...sharedMob} />,
          <LGIPanel        key="lgi"        {...sharedMob} />,
          <LGRPanel        key="lgr"        {...sharedMob} />,
          <QuadrantPanel   key="quadrant"   {...sharedMob} />,
          <TrajectoryPanel key="trajectory" {...sharedMob} />,
        ];

        return isMobile ? (
          selected && mobileCards.length > 0 && (
            <>
              <div className="mobile-backdrop" onClick={() => setSelected(null)} />
              <div className="mobile-stack-wrapper">
                <Stack key={`mob-${selected}-${variable}`} sendToBackOnClick sensitivity={180} cards={mobileCards} />
              </div>
            </>
          )
        ) : (
          <RightPanel
            lookup={data.lookup}
            country={selected}
            year={year}
            dark={dark}
            healthMetric={healthMetric}
          />
        );
      })()}


      <Timeline
        year={year}
        onYearChange={handleYearChange}
        playing={playing}
        onTogglePlay={() => setPlaying((p) => !p)}
      />
    </div>
  );
}
