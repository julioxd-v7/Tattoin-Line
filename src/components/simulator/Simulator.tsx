'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { CameraCapture } from './CameraCapture';
import { artFromFile, artFromUrl, photoFromFile, renderComposite } from '@/lib/simulator-dom';
import {
  LIMITS, clamp, historyInit, historyPush, historyRedo, historyUndo, initialTransform, sanitize,
  type History, type Transform
} from '@/lib/simulator';
import { formatBRLShort } from '@/lib/money';

const SimEditor = dynamic(() => import('./SimEditor'), {
  ssr: false,
  loading: () => <div className="sim-stage-box"><p className="sim-empty">Carregando editor…</p></div>
});

export interface SimProject {
  slug: string; name: string; style: string | null; priceCents: number; sizeLabel: string; simUrl: string; alt: string;
}

type Design = { kind: 'projeto'; project: SimProject } | { kind: 'proprio'; name: string };

const PAGE = 12;
const DEFAULT: Transform = { x: 0.5, y: 0.5, scale: 0.3, rotation: 0, opacity: 0.92 };

export function Simulator({ projects, initialSlug, brand }: { projects: SimProject[]; initialSlug?: string; brand: string }) {
  const [tab, setTab] = useState<'projetos' | 'proprio'>('projetos');
  const [search, setSearch] = useState('');
  const [style, setStyle] = useState('');
  const [limit, setLimit] = useState(PAGE);

  const [design, setDesign] = useState<Design | null>(null);
  const [art, setArt] = useState<HTMLImageElement | null>(null);
  const revokeRef = useRef<(() => void) | null>(null);
  const [photo, setPhoto] = useState<HTMLCanvasElement | null>(null);
  const [camera, setCamera] = useState(false);

  const [hist, setHist] = useState<History<Transform>>(historyInit(DEFAULT));
  const [live, setLive] = useState<Transform>(DEFAULT);
  const [compare, setCompare] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const photoInput = useRef<HTMLInputElement>(null);
  const artInput = useRef<HTMLInputElement>(null);

  const styles = useMemo(() => Array.from(new Set(projects.map((p) => p.style).filter(Boolean))) as string[], [projects]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => (!style || p.style === style) && (!q || p.name.toLowerCase().includes(q) || (p.style ?? '').toLowerCase().includes(q)));
  }, [projects, search, style]);

  // ---- estado do desenho (histórico só em gestos concluídos) ----
  const commit = useCallback((t: Transform) => {
    const s = sanitize(t);
    setLive(s);
    setHist((h) => historyPush(h, s));
  }, []);
  const undo = () => { const n = historyUndo(hist); setHist(n); setLive(n.present); };
  const redo = () => { const n = historyRedo(hist); setHist(n); setLive(n.present); };

  function resetFor(img: HTMLImageElement | null, ph: HTMLCanvasElement | null) {
    const t = img && ph ? initialTransform({ w: ph.width, h: ph.height }, { w: img.naturalWidth, h: img.naturalHeight }) : DEFAULT;
    setHist(historyInit(t));
    setLive(t);
  }

  // ---- escolher desenho ----
  async function pickProject(p: SimProject) {
    setError(''); setBusy('Carregando desenho…');
    try {
      const img = await artFromUrl(p.simUrl);
      revokeRef.current?.(); revokeRef.current = null;
      setArt(img); setDesign({ kind: 'projeto', project: p }); resetFor(img, photo);
      const u = new URL(window.location.href); u.searchParams.set('projeto', p.slug); window.history.replaceState(null, '', u);
    } catch {
      setError('Não foi possível carregar este desenho. Tente novamente.');
    } finally { setBusy(''); }
  }

  async function pickOwnArt(file: File) {
    setError(''); setBusy('Abrindo seu desenho…');
    try {
      const { img, revoke } = await artFromFile(file);
      revokeRef.current?.(); revokeRef.current = revoke;
      setArt(img); setDesign({ kind: 'proprio', name: file.name }); resetFor(img, photo);
      const u = new URL(window.location.href); u.searchParams.delete('projeto'); window.history.replaceState(null, '', u);
    } catch (e) { setError((e as Error).message); } finally { setBusy(''); }
  }

  function removeArt() {
    revokeRef.current?.(); revokeRef.current = null;
    setArt(null); setDesign(null); resetFor(null, null);
  }

  useEffect(() => () => revokeRef.current?.(), []);

  // projeto vindo do link /simulador?projeto=...
  const preloaded = useRef(false);
  useEffect(() => {
    if (preloaded.current || !initialSlug) return;
    preloaded.current = true;
    const p = projects.find((x) => x.slug === initialSlug);
    if (p) void pickProject(p);
    else setNotice('Esse projeto não está disponível no simulador. Escolha outro abaixo.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSlug, projects]);

  // ---- foto ----
  async function pickPhoto(file: File) {
    setError(''); setBusy('Preparando a foto…');
    try {
      const c = await photoFromFile(file);
      setPhoto(c); resetFor(art, c);
    } catch (e) { setError((e as Error).message); } finally { setBusy(''); }
  }

  function removePhoto() { setPhoto(null); setCompare(false); }

  // ---- ajustes finos ----
  const nudge = (patch: Partial<Transform>) => commit({ ...live, ...patch });

  function onKey(e: KeyboardEvent) {
    if (!art || !photo) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
    const step = e.shiftKey ? 0.02 : 0.005;
    const map: Record<string, Partial<Transform>> = {
      ArrowLeft: { x: live.x - step }, ArrowRight: { x: live.x + step }, ArrowUp: { y: live.y - step }, ArrowDown: { y: live.y + step },
      '+': { scale: live.scale * 1.05 }, '=': { scale: live.scale * 1.05 }, '-': { scale: live.scale / 1.05 },
      '[': { rotation: live.rotation - (e.shiftKey ? 15 : 2) }, ']': { rotation: live.rotation + (e.shiftKey ? 15 : 2) }
    };
    const p = map[e.key];
    if (p) { e.preventDefault(); nudge(p); }
  }

  async function exportImage() {
    if (!photo || !art) return;
    setBusy('Gerando imagem…');
    try {
      const blob = await renderComposite(photo, art, live, `Simulação ilustrativa · ${brand}`);
      const file = new File([blob], 'simulacao-tatuagem.png', { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if ('share' in navigator && nav.canShare?.({ files: [file] }) && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ files: [file], title: 'Minha simulação' }).catch(() => undefined);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'simulacao-tatuagem.png'; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
    } catch (e) {
      setError((e as Error).message || 'Não foi possível gerar a imagem.');
    } finally { setBusy(''); }
  }

  async function book() {
    if (design?.kind !== 'projeto') return;
    setBusy('Conferindo disponibilidade…'); setError('');
    try {
      const mes = new Date().toISOString().slice(0, 7);
      const r = await fetch(`/api/disponibilidade?service=projeto&projeto=${encodeURIComponent(design.project.slug)}&mes=${mes}`);
      if (r.status === 409) { setError('Este projeto acabou de ser reservado por outra pessoa. Escolha outro desenho.'); return; }
      window.location.href = `/agendar?projeto=${encodeURIComponent(design.project.slug)}&origem=simulador`;
    } catch {
      setError('Sem conexão para conferir a agenda. Tente de novo.');
    } finally { setBusy(''); }
  }

  const ready = !!(photo && art);
  const pct = (v: number) => Math.round(v * 100);

  return (
    <div className={`sim${ready ? ' is-ready' : ''}`}>
      {/* ---------------- painel ---------------- */}
      <div className="sim-side">
        <section className="sim-step" aria-labelledby="s1">
          <h2 id="s1"><span>1</span> Escolha o desenho</h2>
          <div className="seg" role="tablist" aria-label="Origem do desenho">
            <button type="button" role="tab" aria-selected={tab === 'projetos'} onClick={() => setTab('projetos')}>Projetos do artista</button>
            <button type="button" role="tab" aria-selected={tab === 'proprio'} onClick={() => setTab('proprio')}>Meu desenho</button>
          </div>
          {notice ? <p className="alert" role="status">{notice}</p> : null}

          {tab === 'projetos' ? (
            projects.length ? (
              <>
                <div className="sim-filters">
                  <input className="input" type="search" placeholder="Buscar por nome ou estilo" value={search} onChange={(e) => { setSearch(e.target.value); setLimit(PAGE); }} aria-label="Buscar projeto" />
                  {styles.length > 1 ? (
                    <div className="chips" role="group" aria-label="Filtrar por estilo">
                      <button type="button" className="chip" aria-pressed={!style} onClick={() => { setStyle(''); setLimit(PAGE); }}>Todos</button>
                      {styles.map((s) => <button key={s} type="button" className="chip" aria-pressed={style === s} onClick={() => { setStyle(s); setLimit(PAGE); }}>{s}</button>)}
                    </div>
                  ) : null}
                </div>
                {filtered.length ? (
                  <ul className="sim-grid">
                    {filtered.slice(0, limit).map((p) => (
                      <li key={p.slug}>
                        <button type="button" className="sim-pick" aria-pressed={design?.kind === 'projeto' && design.project.slug === p.slug} onClick={() => pickProject(p)}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.simUrl} alt={p.alt} loading="lazy" crossOrigin="anonymous" />
                          <span className="n">{p.name}</span>
                          <span className="m">{formatBRLShort(p.priceCents)} · {p.sizeLabel}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : <p className="small">Nenhum projeto encontrado com esse filtro.</p>}
                {filtered.length > limit ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLimit((l) => l + PAGE)}>Mostrar mais</button> : null}
              </>
            ) : (
              <p className="small">Ainda não há projetos liberados para o simulador. Você pode testar com um desenho seu na aba “Meu desenho”.</p>
            )
          ) : (
            <div className="sim-own">
              <p className="small">Use um <strong>PNG ou WebP com fundo transparente</strong> (até 8 MB). O arquivo não sai do seu aparelho.</p>
              <input ref={artInput} type="file" accept="image/png,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void pickOwnArt(f); e.target.value = ''; }} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => artInput.current?.click()}>Escolher arquivo</button>
              {design?.kind === 'proprio' ? <p className="small">Usando: {design.name}</p> : null}
            </div>
          )}
        </section>

        <section className="sim-step" aria-labelledby="s2">
          <h2 id="s2"><span>2</span> Foto da região do corpo</h2>
          <p className="small">Boa luz, pele à mostra e a câmera de frente para a região. Sua foto fica só neste aparelho: nada é enviado ao site.</p>
          <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void pickPhoto(f); e.target.value = ''; }} />
          <div className="sim-row">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => photoInput.current?.click()}>{photo ? 'Trocar foto' : 'Enviar foto'}</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCamera(true)}>Usar câmera</button>
            {photo ? <button type="button" className="btn-link" onClick={removePhoto}>Remover foto</button> : null}
          </div>
        </section>

        {ready ? (
          <section className="sim-step" aria-labelledby="s3">
            <h2 id="s3"><span>3</span> Ajuste</h2>
            <p className="small">Arraste o desenho; use as alças para girar e mudar o tamanho (no celular, dois dedos).</p>
            <label className="sim-range"><span>Tamanho <output>{pct(live.scale)}%</output></span>
              <input type="range" min={pct(LIMITS.minScale)} max={pct(LIMITS.maxScale)} value={pct(live.scale)} onChange={(e) => setLive((t) => ({ ...t, scale: Number(e.target.value) / 100 }))} onPointerUp={() => commit(live)} onKeyUp={() => commit(live)} onBlur={() => commit(live)} />
            </label>
            <label className="sim-range"><span>Rotação <output>{Math.round(live.rotation)}°</output></span>
              <input type="range" min={-180} max={180} value={Math.round(live.rotation)} onChange={(e) => setLive((t) => ({ ...t, rotation: Number(e.target.value) }))} onPointerUp={() => commit(live)} onKeyUp={() => commit(live)} onBlur={() => commit(live)} />
            </label>
            <label className="sim-range"><span>Opacidade <output>{pct(live.opacity)}%</output></span>
              <input type="range" min={pct(LIMITS.minOpacity)} max={100} value={pct(live.opacity)} onChange={(e) => setLive((t) => ({ ...t, opacity: clamp(Number(e.target.value) / 100, LIMITS.minOpacity, 1) }))} onPointerUp={() => commit(live)} onKeyUp={() => commit(live)} onBlur={() => commit(live)} />
            </label>
            <div className="sim-tools">
              <button type="button" className="btn btn-ghost btn-sm" onClick={undo} disabled={!hist.past.length}>Desfazer</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={redo} disabled={!hist.future.length}>Refazer</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => nudge({ x: 0.5, y: 0.5 })}>Centralizar</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => commit(initialTransform({ w: photo!.width, h: photo!.height }, { w: art!.naturalWidth, h: art!.naturalHeight }))}>Restaurar</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={removeArt}>Remover desenho</button>
            </div>
          </section>
        ) : null}
      </div>

      {/* ---------------- palco ---------------- */}
      <div className="sim-main">
        <div className="sim-canvas" tabIndex={ready ? 0 : -1} onKeyDown={onKey} aria-label={ready ? 'Área de edição. Setas movem, + e − mudam o tamanho, [ e ] giram, Ctrl+Z desfaz.' : undefined} role={ready ? 'application' : undefined}>
          {photo ? (
            <SimEditor photo={photo} art={art} value={live} hideArt={compare} onCommit={commit} />
          ) : (
            <div className="sim-stage-box">
              <div className="sim-empty">
                <strong>Adicione uma foto</strong>
                <span>Envie da galeria ou use a câmera para ver o desenho na sua pele.</span>
              </div>
            </div>
          )}
          {busy ? <div className="sim-busy" role="status">{busy}</div> : null}
        </div>
        {error ? <p className="alert alert-bad" role="alert">{error}</p> : null}

        {ready ? (
          <div className="sim-actions">
            <button type="button" className="btn btn-ghost btn-sm" aria-pressed={compare} onClick={() => setCompare((c) => !c)}>{compare ? 'Mostrar desenho' : 'Ver sem o desenho'}</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={exportImage}>Baixar imagem</button>
            <span className="grow" />
            {design?.kind === 'projeto' ? (
              <>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTab('projetos')}>Escolher outra</button>
                <button type="button" className="btn btn-accent" onClick={book} disabled={!!busy}>Agendar esta tatuagem</button>
              </>
            ) : (
              <Link className="btn btn-accent" href="/agendar?origem=simulador">Pedir orçamento</Link>
            )}
          </div>
        ) : null}
        <p className="sim-note small">
          Prévia ilustrativa: o resultado real depende do tipo de pele, da curvatura da região e do tamanho final, definidos com o tatuador.
          {design?.kind === 'projeto' ? <> · {design.project.name}, {formatBRLShort(design.project.priceCents)}</> : null}
        </p>
      </div>

      {camera ? <CameraCapture onClose={() => setCamera(false)} onCapture={(c) => { setCamera(false); setPhoto(c); resetFor(art, c); }} /> : null}
    </div>
  );
}
