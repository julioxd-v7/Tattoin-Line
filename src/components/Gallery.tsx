'use client';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Link2 } from 'lucide-react';
import { LineArt } from './Icons';

export function Gallery({ images, art, title }: { images: { url: string; alt: string }[]; art: string; title: string }) {
  const [i, setI] = useState(0);
  const n = images.length;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (n < 2) return;
      if (e.key === 'ArrowRight') setI((v) => (v + 1) % n);
      if (e.key === 'ArrowLeft') setI((v) => (v - 1 + n) % n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [n]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="lb-stage">
        {n > 1 ? <button type="button" className="icon-btn" aria-label="Imagem anterior" onClick={() => setI((i - 1 + n) % n)}><ChevronLeft size={18} aria-hidden /></button> : null}
        <div className="lb-img">
          {n ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={images[i].url} alt={images[i].alt} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : <LineArt path={art} stroke="#2e2c29" width={1.1} />}
        </div>
        {n > 1 ? <button type="button" className="icon-btn" aria-label="Próxima imagem" onClick={() => setI((i + 1) % n)}><ChevronRight size={18} aria-hidden /></button> : null}
      </div>
      {n > 1 ? <p className="small" style={{ textAlign: 'center', margin: 0 }} aria-live="polite">{title} — imagem {i + 1} de {n}</p> : null}
    </div>
  );
}

export function ShareButton() {
  const [label, setLabel] = useState('Copiar link');
  return (
    <button type="button" className="btn btn-ghost btn-sm" onClick={async () => {
      const url = window.location.href;
      try {
        if ('share' in navigator) { await navigator.share({ url }); return; }
        await navigator.clipboard.writeText(url);
        setLabel('Link copiado');
      } catch { setLabel(url); }
    }}><Link2 size={16} aria-hidden /> {label}</button>
  );
}
