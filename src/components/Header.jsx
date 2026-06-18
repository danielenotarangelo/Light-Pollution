export default function Header({ variable, onVariableChange, dark, onToggleTheme }) {
  const toggles = [
    { key: 'r',      label: 'Light'  },
    { key: 'g',      label: 'Wealth' },
    { key: 'health', label: 'Health' },
  ];

  return (
    <header>
      <div className="brand">
        <h1>Nights of Light</h1>
        <p>Artificial light · economic output · mental health · 2013–2023</p>
      </div>
      <div className="head-right">
        <div className="toggles">
          {toggles.map((t) => (
            <button
              key={t.key}
              className={`toggle${variable === t.key ? ' active' : ''}`}
              data-var={t.key}
              onClick={() => onVariableChange(variable === t.key ? null : t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button className="theme-btn" title="Toggle theme" onClick={onToggleTheme}>
          {dark ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
