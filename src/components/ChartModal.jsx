import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

export default function ChartModal({ title, subtitle, country, meta, onClose, children }) {
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => setClosing(true), []);

  // After exit animation completes, unmount
  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(onClose, 200);
    return () => clearTimeout(t);
  }, [closing, onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [handleClose]);

  return createPortal(
    <div className={`chart-modal-backdrop${closing ? ' closing' : ''}`} onClick={handleClose}>
      <div className={`chart-modal${closing ? ' closing' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="chart-modal-head">
          <div>
            {subtitle && <div className="fp-label">{subtitle}</div>}
            <h2>{title}</h2>
            {country && <div className="fp-country">{country}</div>}
            {meta && <div className="chart-modal-meta">{meta}</div>}
          </div>
          <button className="close-x" onClick={handleClose}>✕</button>
        </div>
        <div className="chart-modal-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
