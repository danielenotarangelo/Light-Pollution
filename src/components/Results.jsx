import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import * as d3 from 'd3';
import './Results.css';

const YEARS = [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
const TIER_LABELS = ['Low income', 'Lower-mid', 'Upper-mid', 'High income'];
const TIER_COLORS = ['#60a5fa', '#818cf8', '#a78bfa', '#c084fc'];

// ── Mini chart components ────────────────────────────────────────────────────

function TrendBars({ vals, years, highlightYear }) {
  const W = 560, H = 108, PL = 4, PR = 4, PT = 6, PB = 22;
  const cW = W - PL - PR, cH = H - PT - PB;
  const max = Math.max(...vals);
  const bW = cW / years.length;
  const gap = 3;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="results-mini-svg">
      {vals.map((v, i) => {
        const bH = (v / max) * cH;
        const x = PL + i * bW;
        const hl = years[i] === highlightYear;
        const showLabel = i === 0 || i === years.length - 1 || hl;
        return (
          <g key={years[i]}>
            <rect
              x={x + gap / 2} y={PT + cH - bH}
              width={bW - gap} height={bH}
              fill={hl ? '#f59e0b' : '#60a5fa'}
              opacity={highlightYear && !hl ? 0.32 : 0.85}
              rx={2}
            />
            {showLabel && (
              <text x={x + bW / 2} y={H - 5} textAnchor="middle"
                fontSize={9} fill="currentColor" opacity={0.45}>
                {years[i]}
              </text>
            )}
          </g>
        );
      })}
      {highlightYear && (() => {
        const i = years.indexOf(highlightYear);
        const bH = (vals[i] / max) * cH;
        const x = PL + i * bW + gap / 2;
        const y = PT + cH - bH - 14;
        return (
          <text x={x + (bW - gap) / 2} y={y} textAnchor="middle"
            fontSize={9} fontWeight="700" fill="#f59e0b" opacity={0.9}>
            {highlightYear}
          </text>
        );
      })()}
    </svg>
  );
}

function HBarChart({ vals, labels, fmt = (v) => v.toFixed(2) }) {
  const W = 500, H = 114, PL = 84, PR = 70, PT = 4, PB = 4;
  const cW = W - PL - PR, cH = H - PT - PB;
  const max = Math.max(...vals);
  const rowH = cH / vals.length;
  const pad = 8;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="results-mini-svg">
      {vals.map((v, i) => {
        const bW = (v / max) * cW;
        const y = PT + i * rowH;
        return (
          <g key={labels[i]}>
            <text x={PL - 8} y={y + rowH / 2 + 3.5} textAnchor="end"
              fontSize={10} fill="currentColor" opacity={0.5}>
              {labels[i]}
            </text>
            <rect
              x={PL} y={y + pad / 2}
              width={bW} height={rowH - pad}
              fill={TIER_COLORS[i]} opacity={0.82} rx={3}
            />
            <text x={PL + bW + 7} y={y + rowH / 2 + 3.5}
              fontSize={10} fill="currentColor" opacity={0.55}>
              {fmt(v)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ScatterPlot({ points }) {
  const W = 540, H = 150, PL = 32, PR = 16, PT = 10, PB = 26;
  const cW = W - PL - PR, cH = H - PT - PB;
  if (!points || points.length === 0) return null;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const logMin = Math.log10(Math.max(Math.min(...xs), 0.01));
  const logMax = Math.log10(Math.max(...xs));
  const yMin = Math.min(...ys), yMax = Math.max(...ys);

  const xPos = (v) => PL + ((Math.log10(Math.max(v, 0.01)) - logMin) / (logMax - logMin)) * cW;
  const yPos = (v) => PT + cH - ((v - yMin) / (yMax - yMin)) * cH;

  // Trend line via linear regression on log(x) vs y
  const lxs = xs.map((x) => Math.log10(Math.max(x, 0.01)));
  const n = points.length;
  const mlx = lxs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  const slope = lxs.reduce((s, lx, i) => s + (lx - mlx) * (ys[i] - my), 0) /
                lxs.reduce((s, lx) => s + (lx - mlx) ** 2, 0);
  const intercept = my - slope * mlx;
  const ty1 = yPos(slope * logMin + intercept);
  const ty2 = yPos(slope * logMax + intercept);

  const xTicks = [0.5, 1, 2, 5, 10, 20, 50].filter((v) => v >= Math.pow(10, logMin) * 0.7 && v <= Math.pow(10, logMax) * 1.4);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="results-mini-svg">
      {/* Axes */}
      <line x1={PL} y1={PT + cH} x2={PL + cW} y2={PT + cH} stroke="currentColor" strokeWidth={0.5} opacity={0.2} />
      <line x1={PL} y1={PT} x2={PL} y2={PT + cH} stroke="currentColor" strokeWidth={0.5} opacity={0.2} />

      {/* Trend line */}
      <line x1={PL} y1={ty1} x2={PL + cW} y2={ty2}
        stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.55} />

      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={xPos(p.x)} cy={yPos(p.y)} r={3.5}
          fill="#60a5fa" opacity={0.72} />
      ))}

      {/* X ticks */}
      {xTicks.map((v) => (
        <text key={v} x={xPos(v)} y={H - 8} textAnchor="middle"
          fontSize={8.5} fill="currentColor" opacity={0.4}>
          {v}
        </text>
      ))}

      {/* Axis labels */}
      <text x={PL + cW / 2} y={H - 1} textAnchor="middle"
        fontSize={8.5} fill="currentColor" opacity={0.35}>
        Radiance nW/cm²/sr (log scale) →
      </text>
      <text x={10} y={PT + cH / 2} textAnchor="middle"
        fontSize={8.5} fill="currentColor" opacity={0.35}
        transform={`rotate(-90, 10, ${PT + cH / 2})`}>
        Depression per 100k
      </text>
    </svg>
  );
}

// ── Slide definitions ────────────────────────────────────────────────────────

const SLIDES = [
  {
    eyebrow: 'Key Findings · 2013–2023',
    title: 'What the Satellites Found',
    body: 'Ten years of VIIRS data, 189 countries, three datasets. Here is what connects nighttime light to economic development — and to mental health.',
    big: true,
    icon: 'conclusion',
  },
  {
    eyebrow: 'Global Radiance',
    stat: '+82%',
    title: 'A World Getting Brighter',
    body: 'Median radiance rose 82.5% in a decade — an accelerating wave of electrification that no major crisis has reversed.',
    chart: 'trend',
  },
  {
    eyebrow: 'Fastest Growing',
    stat: '+16,000%',
    statNote: 'Comoros, 2013 → 2023',
    title: 'Sub-Saharan Africa Lit Up',
    body: 'Comoros grew 16,000× brighter over the decade. Cameroon (+3,131%), Ethiopia (+1,806%), and Botswana (+1,948%) follow close behind — rapid electrification, not policy failure.',
    icon: 'growth',
  },
  {
    eyebrow: 'The COVID Paradox · 2020',
    title: 'Lockdowns Didn\'t Dim the Lights',
    body: 'In 2020 — factories closed, planes grounded — global median radiance hit a then-record high. Light proved more resilient than the economies that produce it.',
    chart: 'covid',
  },
  {
    eyebrow: 'Income vs. Light',
    stat: '4×',
    statNote: 'High-income vs. low-income median radiance',
    title: 'Richer Countries Shine 4× Brighter',
    body: 'High-income nations emit nearly four times the nighttime radiance of low-income ones. The gradient is steep and consistent every year.',
    chart: 'tier-r',
  },
  {
    eyebrow: 'Mental Health Signal',
    stat: '3,278 → 4,432',
    statNote: 'Depression cases per 100k · Low → High income',
    title: 'Depression Rises With Every Tier',
    body: 'Median depression prevalence climbs 35% from low-income to high-income countries — tracking the same income gradient as radiance.',
    chart: 'tier-d',
  },
  {
    eyebrow: 'The Critical Test',
    title: 'Even Among the Rich, Radiance Tracks Health',
    body: 'Within high-income countries, the most intensely lit — Kuwait, Qatar, Israel, Netherlands — consistently rank highest for depression. Wealth alone doesn\'t explain the signal.',
    chart: 'scatter',
  },
  {
    eyebrow: 'The Exceptions',
    stat: '17',
    statNote: 'countries reduced nighttime radiance',
    title: 'Seventeen Countries Got Darker',
    body: 'Switzerland, Portugal (−6.7%), Luxembourg (−6.8%) and 14 others actually reduced radiance. LED retrofits and dark-sky legislation show a path almost no one else has followed.',
    icon: 'dim',
  },
  {
    eyebrow: 'Synthesis',
    title: 'Light Is Both Symptom and Signal',
    body: 'Nighttime radiance maps economic development closely — but within every income group, the brightest nations carry a heavier mental-health burden. The satellite may be measuring something GDP figures don\'t fully capture.',
    icon: 'globe',
  },
];

const ICONS = {
  globe: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="3.5" ry="9"/>
      <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
    </svg>
  ),
  growth: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  dim: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
      <line x1="4.9" y1="4.9" x2="6.3" y2="6.3"/><line x1="17.7" y1="17.7" x2="19.1" y2="19.1"/>
      <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
      <line x1="4.9" y1="19.1" x2="6.3" y2="17.7"/><line x1="17.7" y1="6.3" x2="19.1" y2="4.9"/>
      <line x1="2" y1="2" x2="22" y2="22" strokeWidth="1" strokeDasharray="2,2"/>
    </svg>
  ),
  conclusion: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2"/>
    </svg>
  ),
};

const slideVariants = {
  enter:  (dir) => ({ y: dir > 0 ?  48 : -48, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit:   (dir) => ({ y: dir > 0 ? -48 :  48, opacity: 0 }),
};
const transition = { duration: 0.34, ease: [0.4, 0, 0.2, 1] };

// ── Main component ───────────────────────────────────────────────────────────

export default function Results({ onClose, data }) {
  const [current,   setCurrent]   = useState(0);
  const [direction, setDirection] = useState(1);
  const [leaving,   setLeaving]   = useState(false);

  const total  = SLIDES.length;
  const isLast = current === total - 1;

  // Compute all chart data once from the data bundle
  const computed = useMemo(() => {
    if (!data) return null;
    const entries = Object.values(data.lookup);

    // Global median radiance per year
    const globalRadiance = YEARS.map((yr) => {
      const vs = entries.map((e) => e[yr]?.r).filter((v) => v != null);
      return d3.median(vs) ?? 0;
    });

    // Income tier stats for 2023
    const y23 = entries
      .map((e) => ({ r: e[2023]?.r, g: e[2023]?.g, dep: e[2023]?.d }))
      .filter((e) => e.g != null && e.r != null);
    y23.sort((a, b) => a.g - b.g);
    const gdps = y23.map((e) => e.g);
    const q1 = d3.quantile(gdps, 0.25);
    const q2 = d3.quantile(gdps, 0.5);
    const q3 = d3.quantile(gdps, 0.75);
    const tiers = [[], [], [], []];
    y23.forEach((e) => {
      const t = e.g <= q1 ? 0 : e.g <= q2 ? 1 : e.g <= q3 ? 2 : 3;
      tiers[t].push(e);
    });
    const tierRadiance   = tiers.map((t) => d3.median(t.map((e) => e.r)) ?? 0);
    const tierDepression = tiers.map((t) => {
      const ds = t.map((e) => e.dep).filter((v) => v != null);
      return ds.length ? (d3.median(ds) ?? 0) : 0;
    });
    const scatterPoints = tiers[3]
      .filter((e) => e.dep != null)
      .map((e) => ({ x: e.r, y: e.dep }));

    return { globalRadiance, tierRadiance, tierDepression, scatterPoints };
  }, [data]);

  const goTo = useCallback((idx) => {
    if (idx === current || leaving || idx < 0 || idx >= total) return;
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }, [current, leaving, total]);

  const advance = useCallback(() => {
    if (leaving) return;
    if (isLast) { setLeaving(true); setTimeout(onClose, 600); }
    else goTo(current + 1);
  }, [current, isLast, leaving, goTo, onClose]);

  const close = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onClose, 600);
  }, [leaving, onClose]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') advance();
      else if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goTo(current - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, goTo, close, current]);

  const slide = SLIDES[current];
  const hasChart = !!slide.chart && !!computed;

  return (
    <div className={`results${leaving ? ' leaving' : ''}`}>

      <button className="results-close" onClick={close} aria-label="Close findings">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <div className="results-stage">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className={`results-slide${hasChart ? ' has-chart' : ''}`}
          >
            {slide.icon && (
              <div className="results-icon">{ICONS[slide.icon]}</div>
            )}
            <p className="results-eyebrow">{slide.eyebrow}</p>
            {slide.stat && (
              <div className="results-stat-block">
                <span className="results-stat">{slide.stat}</span>
                {slide.statNote && <span className="results-stat-note">{slide.statNote}</span>}
              </div>
            )}
            <h2 className={`results-title${slide.big ? ' big' : ''}`}>{slide.title}</h2>

            {hasChart && (
              <div className="results-chart">
                {slide.chart === 'trend'   && <TrendBars vals={computed.globalRadiance} years={YEARS} />}
                {slide.chart === 'covid'   && <TrendBars vals={computed.globalRadiance} years={YEARS} highlightYear={2020} />}
                {slide.chart === 'tier-r'  && <HBarChart vals={computed.tierRadiance}   labels={TIER_LABELS} fmt={(v) => `${v.toFixed(2)} nW`} />}
                {slide.chart === 'tier-d'  && <HBarChart vals={computed.tierDepression} labels={TIER_LABELS} fmt={(v) => v.toFixed(0)} />}
                {slide.chart === 'scatter' && <ScatterPlot points={computed.scatterPoints} />}
              </div>
            )}

            <p className="results-desc">{slide.body}</p>
            <p className="results-counter">{current + 1} / {total}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <button className="landing-arrow-btn" onClick={advance} aria-label={isLast ? 'Close' : 'Next finding'}>
        <svg className="landing-arrow" width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <nav className="landing-dots" aria-label="Finding navigation">
        {SLIDES.map((_, i) => (
          <button key={i} className={`landing-dot${i === current ? ' active' : ''}`}
            onClick={() => goTo(i)} aria-label={`Finding ${i + 1}`} />
        ))}
      </nav>

    </div>
  );
}
