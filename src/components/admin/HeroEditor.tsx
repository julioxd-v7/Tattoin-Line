'use client';
import { useState, type MouseEvent } from 'react';
import { ActionForm, Submit } from '@/components/ActionForm';
import type { ActionState } from '@/app/admin/actions';
import { HERO_LIMITS, heroTitleLines } from '@/lib/hero';
import type { HeroLayout } from '@/lib/types';

type Action = (state: ActionState, form: FormData) => Promise<ActionState>;

export interface HeroEditorValues {
  eyebrow: string;
  title: string;
  subtitle: string;
  layout: HeroLayout;
  overlay: number; // 0–85
  focusX: number;  // 0–100
  focusY: number;  // 0–100
  zoom: number;    // 100–200
}

/**
 * Editor da primeira dobra no painel: textos, layout da foto, escurecimento,
 * ponto de foco e zoom, com prévia ao vivo (computador e celular).
 */
export function HeroEditor({ action, initial, imageUrl, brand }: { action: Action; initial: HeroEditorValues; imageUrl: string | null; brand: string }) {
  const [v, setV] = useState(initial);
  const set = <K extends keyof HeroEditorValues>(k: K, val: HeroEditorValues[K]) => setV((o) => ({ ...o, [k]: val }));
  const L = HERO_LIMITS;

  // clique na foto da prévia = novo ponto de foco
  const pickFocus = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setV((o) => ({ ...o, focusX: Math.round(((e.clientX - r.left) / r.width) * 100), focusY: Math.round(((e.clientY - r.top) / r.height) * 100) }));
  };

  return (
    <ActionForm action={action}>
      <div className="hero-editor">
        <div className="hero-editor-fields">
          <label className="field">
            <span>Rótulo acima do título <small>— opcional; vazio usa “{brand}”</small></span>
            <input className="input" name="eyebrow" value={v.eyebrow} maxLength={L.eyebrowMax} placeholder={brand} onChange={(e) => set('eyebrow', e.target.value)} />
          </label>
          <label className="field">
            <span>Título principal <small>— Enter quebra a linha (até {L.titleLines} linhas)</small></span>
            <textarea className="textarea" name="title" rows={3} value={v.title} maxLength={L.titleMax} required style={{ minHeight: 96 }} onChange={(e) => set('title', e.target.value)} />
          </label>
          <label className="field">
            <span>Frase de apresentação</span>
            <textarea className="textarea" name="subtitle" rows={3} value={v.subtitle} maxLength={L.subtitleMax} style={{ minHeight: 96 }} onChange={(e) => set('subtitle', e.target.value)} />
          </label>

          <fieldset className="hero-editor-group">
            <legend className="label">Foto</legend>
            <div className="seg" role="radiogroup" aria-label="Posição da foto">
              {(['lateral', 'fundo'] as const).map((opt) => (
                <label key={opt} className="seg-opt">
                  <input type="radio" name="layout" value={opt} checked={v.layout === opt} onChange={() => set('layout', opt)} />
                  <span>{opt === 'lateral' ? 'Na lateral direita' : 'Como fundo'}</span>
                </label>
              ))}
            </div>
            <label className="sim-range">
              <span>Escurecimento <output>{v.overlay}%</output></span>
              <input type="range" name="overlay" min={L.overlay.min} max={L.overlay.max} step={5} value={v.overlay} onChange={(e) => set('overlay', Number(e.target.value))} />
            </label>
            <label className="sim-range">
              <span>Foco horizontal <output>{v.focusX}%</output></span>
              <input type="range" name="focus_x" min={0} max={100} value={v.focusX} onChange={(e) => set('focusX', Number(e.target.value))} />
            </label>
            <label className="sim-range">
              <span>Foco vertical <output>{v.focusY}%</output></span>
              <input type="range" name="focus_y" min={0} max={100} value={v.focusY} onChange={(e) => set('focusY', Number(e.target.value))} />
            </label>
            <label className="sim-range">
              <span>Aproximação <output>{v.zoom}%</output></span>
              <input type="range" name="zoom" min={L.zoom.min} max={L.zoom.max} step={5} value={v.zoom} onChange={(e) => set('zoom', Number(e.target.value))} />
            </label>
            <button type="button" className="btn-link" style={{ alignSelf: 'flex-start' }} onClick={() => setV((o) => ({ ...o, overlay: L.overlay.default, focusX: 50, focusY: 50, zoom: 100 }))}>Restaurar enquadramento</button>
          </fieldset>
        </div>

        <div className="hero-editor-preview">
          <p className="small" style={{ margin: 0 }}>{imageUrl ? 'Prévia. Clique na foto para escolher o ponto que deve ficar sempre visível.' : 'Prévia. Envie a foto no quadro abaixo para ajustar o enquadramento.'}</p>
          <Preview v={v} imageUrl={imageUrl} brand={brand} device="desktop" onPick={pickFocus} />
          <Preview v={v} imageUrl={imageUrl} brand={brand} device="mobile" onPick={pickFocus} />
        </div>
      </div>
      <Submit>Salvar topo da página</Submit>
    </ActionForm>
  );
}

function Preview({ v, imageUrl, brand, device, onPick }: { v: HeroEditorValues; imageUrl: string | null; brand: string; device: 'desktop' | 'mobile'; onPick: (e: MouseEvent<HTMLDivElement>) => void }) {
  const lines = heroTitleLines(v.title);
  const full = device === 'mobile' || v.layout === 'fundo';
  return (
    <figure className="hero-pv" data-device={device} data-full={full} data-layout={v.layout} aria-label={device === 'desktop' ? 'Prévia no computador' : 'Prévia no celular'}>
      <div className="hero-pv-box theme-dark">
      <div className="hero-pv-media" onClick={imageUrl ? onPick : undefined} style={{ cursor: imageUrl ? 'crosshair' : 'default' }}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" style={{ objectPosition: `${v.focusX}% ${v.focusY}%`, transform: `scale(${v.zoom / 100})`, transformOrigin: `${v.focusX}% ${v.focusY}%` }} />
        ) : <span className="hero-pv-empty">Imagem principal</span>}
        {imageUrl ? <span className="hero-pv-shade" style={{ background: `rgba(0,0,0,${v.overlay / 100})` }} /> : null}
        {imageUrl ? <span className="hero-pv-focus" style={{ left: `${v.focusX}%`, top: `${v.focusY}%` }} aria-hidden="true" /> : null}
      </div>
      <div className="hero-pv-text">
        <span className="hero-pv-eyebrow">{v.eyebrow.trim() || brand}</span>
        <span className="hero-pv-title">{lines.map((l, i) => <span key={i}>{l}</span>)}</span>
        <span className="hero-pv-btns"><i /><i /></span>
      </div>
      </div>
      <figcaption className="small">{device === 'desktop' ? 'Computador' : 'Celular'}</figcaption>
    </figure>
  );
}
