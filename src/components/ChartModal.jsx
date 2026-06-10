import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ChartModal({ title, subtitle, country, meta, onClose, children }) {
  // Lock scroll and close on Escape
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="chart-modal-backdrop" onClick={onClose}>
      <div className="chart-modal" onClick={e => e.stopPropagation()}>
        <div className="chart-modal-head">
          <div>
            {subtitle && <div className="fp-label">{subtitle}</div>}
            <h2>{title}</h2>
            {country && <div className="fp-country">{country}</div>}
            {meta && <div className="chart-modal-meta">{meta}</div>}
          </div>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>
        <div className="chart-modal-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
