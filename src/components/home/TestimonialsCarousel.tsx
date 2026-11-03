'use client';
import { useRef, useState, type TouchEvent } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export interface TestimonialItem {
  id: string;
  body: string;
  author: string;
  source: string | null;
  rating: number | null;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Um depoimento por vez, com setas, contador e deslizar no celular.
 * Não troca sozinho (quem lê decide o ritmo). Só mostra o que veio do banco.
 */
export function TestimonialsCarousel({ items }: { items: TestimonialItem[] }) {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const touch = useRef<number | null>(null);
  const n = items.length;
  const go = (step: 1 | -1) => { setDir(step); setI((v) => (v + step + n) % n); };
  const t = items[i];

  const onTouchStart = (e: TouchEvent) => { touch.current = e.touches[0].clientX; };
  const onTouchEnd = (e: TouchEvent) => {
    if (touch.current == null || n < 2) return;
    const dx = e.changedTouches[0].clientX - touch.current;
    touch.current = null;
    if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1);
  };

  return (
    <div className="quotes" role="region" aria-roledescription="carrossel" aria-label="Depoimentos de clientes" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <figure
        key={t.id}
        className={`quote${t.body.length > 280 ? ' is-long' : ''}`}
        data-dir={dir}
        aria-roledescription="slide"
        aria-label={`${i + 1} de ${n}`}
      >
        <blockquote>“{t.body}”</blockquote>
        <figcaption>
          <span className="quote-author">— {t.author}</span>
          {t.source || t.rating ? (
            <span className="label quote-meta">
              {t.source ? t.source : null}
              {t.source && t.rating ? ' · ' : null}
              {t.rating ? <span aria-label={`nota ${t.rating} de 5`}>{t.rating}/5</span> : null}
            </span>
          ) : null}
        </figcaption>
      </figure>

      {n > 1 ? (
        <div className="quotes-nav">
          <button type="button" className="icon-btn" onClick={() => go(-1)} aria-label="Depoimento anterior"><ArrowLeft size={18} strokeWidth={1.5} aria-hidden /></button>
          <button type="button" className="icon-btn" onClick={() => go(1)} aria-label="Próximo depoimento"><ArrowRight size={18} strokeWidth={1.5} aria-hidden /></button>
          <span className="index" aria-live="polite">{pad(i + 1)} / {pad(n)}</span>
          <span className="quotes-progress" aria-hidden="true"><span style={{ width: `${((i + 1) / n) * 100}%` }} /></span>
        </div>
      ) : null}
    </div>
  );
}
