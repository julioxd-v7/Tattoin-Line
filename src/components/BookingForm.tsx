'use client';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { depositFor, type SizeTier } from '@/lib/pricing';
import { formatBRL, formatDuration } from '@/lib/money';

export interface BookingProject { slug: string; name: string; price_cents: number; duration_minutes: number; size_label: string; style: string | null }
export interface BookingConfig {
  depositPercent: number; depositMinCents: number; allowFull: boolean; holdMinutes: number;
  consultEnabled: boolean; consultPriceCents: number; consultMinutes: number;
  sizeTiers: SizeTier[]; styles: string[]; projects: BookingProject[]; cancellationPolicy: string;
}

const details = z.object({
  name: z.string().trim().min(3, 'Informe seu nome completo.').max(120),
  email: z.string().trim().email('Informe um e-mail válido.'),
  phone: z.string().trim().refine((v) => v.replace(/\D/g, '').length >= 10, 'Informe o WhatsApp com DDD.'),
  style: z.string().max(60).optional(),
  bodyRegion: z.string().max(80).optional(),
  idea: z.string().max(2000).optional(),
  website: z.string().max(0).optional()
});
type Details = z.infer<typeof details>;

type Service = 'personalizada' | 'projeto' | 'consulta';
const STEPS = ['Serviço', 'Detalhes', 'Data e horário', 'Revisão', 'Pagamento'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

interface Slot { startsAt: string; label: string; available: boolean }

export function BookingForm({ config, initialProject, initialStyle, origin = 'site' }: { config: BookingConfig; initialProject?: string; initialStyle?: string; origin?: 'site' | 'simulador' }) {
  const startProject = config.projects.find((p) => p.slug === initialProject);
  const [step, setStep] = useState(1);
  const [service, setService] = useState<Service>(startProject ? 'projeto' : 'personalizada');
  const [project, setProject] = useState(startProject?.slug ?? config.projects[0]?.slug ?? '');
  const [sizeId, setSizeId] = useState(config.sizeTiers[1]?.id ?? config.sizeTiers[0]?.id ?? '');
  const [chargeMode, setChargeMode] = useState<'sinal' | 'integral'>('sinal');
  const [month, setMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; });
  const [days, setDays] = useState<Record<string, boolean> | null>(null);
  const [day, setDay] = useState('');
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ token: string; checkoutUrl: string | null; status: string } | null>(null);

  const form = useForm<Details>({ resolver: zodResolver(details), defaultValues: { style: initialStyle || config.styles[0] || '', website: '' } });
  const idea = form.watch('idea');

  const proj = config.projects.find((p) => p.slug === project);
  const tier = config.sizeTiers.find((t) => t.id === sizeId);
  const price = useMemo(() => {
    if (service === 'consulta') return { label: 'Consulta de avaliação', total: config.consultPriceCents, dep: config.consultPriceCents, due: config.consultPriceCents, minutes: config.consultMinutes, estimate: false, quote: false };
    if (service === 'projeto' && proj) {
      const dep = depositFor(proj.price_cents, { deposit_percent: config.depositPercent, deposit_min_cents: config.depositMinCents });
      const full = chargeMode === 'integral' && config.allowFull;
      return { label: `Projeto: ${proj.name}`, total: proj.price_cents, dep, due: full ? proj.price_cents : dep, minutes: proj.duration_minutes, estimate: false, quote: false };
    }
    if (tier && tier.from_cents != null && tier.minutes) {
      const dep = depositFor(tier.from_cents, { deposit_percent: config.depositPercent, deposit_min_cents: config.depositMinCents });
      return { label: `Sessão personalizada · ${tier.label}`, total: tier.from_cents, dep, due: dep, minutes: tier.minutes, estimate: true, quote: false };
    }
    return { label: `Sessão personalizada · ${tier?.label ?? ''}`, total: null, dep: null, due: null, minutes: null, estimate: true, quote: true };
  }, [service, proj, tier, chargeMode, config]);

  const query = `service=${service}${service === 'projeto' ? `&projeto=${project}` : ''}${service === 'personalizada' ? `&sizeId=${sizeId}` : ''}`;

  // carrega os dias livres do mês (a duração é calculada no servidor)
  useEffect(() => {
    if (step !== 3 || price.quote) return;
    let alive = true;
    setDays(null);
    fetch(`/api/disponibilidade?${query}&mes=${month}`).then((r) => r.json()).then((j) => { if (alive) { if (j.error) setError(j.error); else setDays(j.days ?? {}); } }).catch(() => alive && setError('Não foi possível carregar a agenda. Verifique sua conexão.'));
    return () => { alive = false; };
  }, [step, month, query, price.quote]);

  useEffect(() => {
    if (!day) return;
    let alive = true;
    setSlots(null); setSlot(null);
    fetch(`/api/disponibilidade?${query}&dia=${day}`).then((r) => r.json()).then((j) => { if (alive) { if (j.error) setError(j.error); else setSlots(j.slots ?? []); } }).catch(() => alive && setError('Não foi possível carregar os horários.'));
    return () => { alive = false; };
  }, [day, query]);

  // mudar o serviço invalida a data escolhida
  useEffect(() => { setDay(''); setSlot(null); setSlots(null); }, [query]);

  const go = (n: number) => { setError(null); setStep(n); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  async function next() {
    setError(null);
    if (step === 1) {
      if (service === 'projeto' && !proj) return setError('Escolha um projeto.');
      return go(2);
    }
    if (step === 2) {
      const ok = await form.trigger();
      if (!ok) return;
      if (service !== 'projeto' && (form.getValues('idea') ?? '').trim().length < 10) {
        form.setError('idea', { message: 'Descreva a ideia em pelo menos uma frase.' });
        return;
      }
      return go(price.quote ? 4 : 3);
    }
    if (step === 3) {
      if (!slot) return setError('Escolha um dia e um horário.');
      return go(4);
    }
    if (step === 4) {
      if (!agree) return setError('É preciso concordar com as condições para continuar.');
      return submit();
    }
  }

  async function uploadReferences(): Promise<string[]> {
    if (!files.length) return [];
    const r = await fetch('/api/referencias', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files: files.map((f) => ({ name: f.name, type: f.type, size: f.size })) }) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error ?? 'Falha ao enviar as imagens.');
    await Promise.all(j.uploads.map((u: { signedUrl: string }, i: number) => fetch(u.signedUrl, { method: 'PUT', headers: { 'Content-Type': files[i].type, 'x-upsert': 'false' }, body: files[i] }).then((res) => { if (!res.ok) throw new Error('Falha ao enviar uma das imagens.'); })));
    return j.uploads.map((u: { path: string }) => u.path);
  }

  async function submit() {
    setBusy(true);
    try {
      const v = form.getValues();
      const referencePaths = await uploadReferences();
      const r = await fetch('/api/agendamentos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service, flashSlug: service === 'projeto' ? project : null, sizeId: service === 'personalizada' ? sizeId : null,
          chargeMode, startsAt: price.quote ? null : slot?.startsAt ?? null,
          customer: { name: v.name, email: v.email, phone: v.phone },
          style: service === 'projeto' ? null : v.style, bodyRegion: v.bodyRegion, idea: service === 'projeto' ? null : v.idea,
          referencePaths, acceptTerms: agree, website: v.website, origin
        })
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error ?? 'Não foi possível concluir.');
        if (r.status === 409 && !price.quote) { setSlot(null); setDay(''); setStep(3); }
        return;
      }
      setDone(j);
      setStep(5);
      if (j.checkoutUrl) window.location.assign(j.checkoutUrl);
    } catch (e) {
      setError((e as Error).message || 'Falha de conexão. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  // calendário
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1).getDay();
  const daysIn = new Date(y, m, 0).getDate();
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const shiftMonth = (k: number) => { const d = new Date(y, m - 1 + k, 1); setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); };
  const err = form.formState.errors;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <ol className="steps" aria-label="Etapas">
        {STEPS.map((l, i) => {
          const n = i + 1;
          if (price.quote && n === 3) return null;
          return <li key={l} aria-current={n === step ? 'step' : undefined} className={n < step ? 'done' : undefined}><span className="n">{n < step ? '✓' : n}</span>{l}</li>;
        })}
      </ol>
      <div className="booking">
        <div className="booking-main">
          {error ? <p className="alert alert-bad" role="alert">{error}</p> : null}

          {step === 1 ? (
            <div className="step-panel" key="s1">
              <fieldset style={{ border: 0, margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <legend className="h3" style={{ padding: '0 0 12px' }}>O que você quer agendar?</legend>
                <Option checked={service === 'personalizada'} onChange={() => setService('personalizada')} title="Sessão personalizada" price={`a partir de ${formatBRL(config.sizeTiers.find((t) => t.from_cents)?.from_cents ?? null)}`} desc="Desenho exclusivo criado a partir da sua ideia." />
                {config.projects.length ? <Option checked={service === 'projeto'} onChange={() => setService('projeto')} title="Projeto autoral disponível" price="preço fixo" desc="Um desenho do catálogo, tatuado uma única vez." /> : null}
                {config.consultEnabled ? <Option checked={service === 'consulta'} onChange={() => setService('consulta')} title="Consulta ou avaliação" price={`${formatBRL(config.consultPriceCents)} · ${formatDuration(config.consultMinutes)}`} desc="Para fechamentos, coberturas ou dúvidas antes de decidir." /> : null}
              </fieldset>
              {service === 'projeto' ? (
                <label className="field" style={{ maxWidth: 420 }}><span>Projeto</span>
                  <select className="select" value={project} onChange={(e) => setProject(e.target.value)}>
                    {config.projects.map((p) => <option key={p.slug} value={p.slug}>{p.name} — {formatBRL(p.price_cents)}</option>)}
                  </select>
                </label>
              ) : null}
              {service === 'personalizada' ? (
                <label className="field" style={{ maxWidth: 420 }}><span>Tamanho aproximado</span>
                  <select className="select" value={sizeId} onChange={(e) => setSizeId(e.target.value)}>
                    {config.sizeTiers.map((t) => <option key={t.id} value={t.id}>{t.label}{t.from_cents ? '' : ' (orçamento)'}</option>)}
                  </select>
                </label>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="step-panel" key="s2">
              <h2 className="h3">Seus dados{service === 'projeto' ? '' : ' e a ideia'}</h2>
              {service === 'projeto' && proj ? <div className="notice"><strong>{proj.name}</strong> · {proj.size_label} · ≈ {formatDuration(proj.duration_minutes)} — dados do projeto preenchidos automaticamente.</div> : null}
              <div className="form-grid">
                <Field label="Nome completo" error={err.name?.message}><input className="input" autoComplete="name" aria-invalid={!!err.name} {...form.register('name')} /></Field>
                <Field label="E-mail" error={err.email?.message}><input className="input" type="email" autoComplete="email" aria-invalid={!!err.email} {...form.register('email')} /></Field>
                <Field label="WhatsApp" error={err.phone?.message}><input className="input" type="tel" autoComplete="tel" placeholder="(81) 9 0000-0000" aria-invalid={!!err.phone} {...form.register('phone')} /></Field>
              </div>
              <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="visually-hidden" {...form.register('website')} />
              {service !== 'projeto' ? (
                <>
                  <div className="form-grid">
                    <Field label="Estilo desejado"><select className="select" {...form.register('style')}>{[...config.styles, 'Não sei ainda'].map((s) => <option key={s}>{s}</option>)}</select></Field>
                    <Field label="Região do corpo"><input className="input" placeholder="ex.: antebraço interno" {...form.register('bodyRegion')} /></Field>
                  </div>
                  <Field label="Descreva a ideia" error={err.idea?.message}><textarea className="textarea" placeholder="O que você imagina, significado, elementos que não podem faltar…" aria-invalid={!!err.idea} {...form.register('idea')} /></Field>
                  <span className="small">{(idea ?? '').length}/2000</span>
                  <Field label="Referências visuais" hint="até 5 imagens JPG, PNG ou WebP, 8 MB cada">
                    <input className="input" style={{ paddingBlock: 10 }} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => {
                      const list = Array.from(e.target.files ?? []);
                      if (list.length > 5 || list.some((f) => f.size > 8 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(f.type))) { setError('Envie até 5 imagens JPG, PNG ou WebP de até 8 MB.'); e.target.value = ''; setFiles([]); return; }
                      setError(null); setFiles(list);
                    }} />
                  </Field>
                </>
              ) : (
                <Field label="Região do corpo (opcional)"><input className="input" placeholder="ex.: antebraço" {...form.register('bodyRegion')} /></Field>
              )}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="step-panel" key="s3">
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <h2 className="h3">Escolha data e horário</h2>
                <span className="small">Horário de Recife · sessão de {formatDuration(price.minutes)}</span>
              </div>
              <div className="form-grid" style={{ gap: 32, alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button type="button" className="icon-btn" aria-label="Mês anterior" disabled={month <= thisMonth} onClick={() => shiftMonth(-1)}><ChevronLeft size={16} aria-hidden /></button>
                    <strong style={{ textTransform: 'capitalize' }}>{MONTHS[m - 1]} {y}</strong>
                    <button type="button" className="icon-btn" aria-label="Próximo mês" onClick={() => shiftMonth(1)}><ChevronRight size={16} aria-hidden /></button>
                  </div>
                  <div className="cal" aria-busy={days === null}>
                    {WD.map((d) => <span key={d} className="dow">{d}</span>)}
                    {Array.from({ length: first }, (_, i) => <span key={`b${i}`} />)}
                    {Array.from({ length: daysIn }, (_, i) => {
                      const ymd = `${month}-${String(i + 1).padStart(2, '0')}`;
                      const open = days?.[ymd] === true;
                      return <button key={ymd} type="button" className="day" disabled={!open} aria-pressed={day === ymd} aria-label={`${i + 1} de ${MONTHS[m - 1]}${open ? '' : ', indisponível'}`} onClick={() => setDay(ymd)}>{i + 1}</button>;
                    })}
                  </div>
                  {days === null ? <p className="small" style={{ margin: 0 }}><Loader2 size={14} className="animate-spin" aria-hidden style={{ display: 'inline', verticalAlign: '-2px' }} /> Carregando agenda…</p> : <p className="small" style={{ margin: 0 }}>Dias riscados estão lotados, fechados ou bloqueados.</p>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <strong>{day ? new Date(`${day}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Horários'}</strong>
                  {!day ? <p className="muted" style={{ margin: 0 }}>Selecione um dia para ver os horários.</p> : slots === null ? <p className="small">Carregando horários…</p> : slots.filter((s) => s.available).length === 0 ? <p className="muted">Nenhum horário livre neste dia.</p> : (
                    <div className="slots">{slots.map((s) => <button key={s.startsAt} type="button" className="slot" disabled={!s.available} aria-pressed={slot?.startsAt === s.startsAt} onClick={() => setSlot(s)}>{s.label}</button>)}</div>
                  )}
                  <p className="small" style={{ margin: 0 }}>Cada horário já considera a duração da sessão e o intervalo entre atendimentos.</p>
                </div>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="step-panel" key="s4">
              <h2 className="h3">Revise antes de confirmar</h2>
              <div className="summary">
                <div><span className="label">Serviço</span><span>{price.label}</span></div>
                <div><span className="label">Data e horário</span><span>{price.quote ? 'A combinar após o orçamento' : slot ? `${new Date(slot.startsAt).toLocaleString('pt-BR', { timeZone: 'America/Recife', dateStyle: 'full', timeStyle: 'short' })}` : '—'}</span></div>
                <div><span className="label">Duração estimada</span><span>{formatDuration(price.minutes)}</span></div>
                <div><span className="label">{price.estimate ? 'Valor estimado' : 'Valor total'}</span><span>{price.total != null ? `${price.estimate ? 'a partir de ' : ''}${formatBRL(price.total)}` : 'Sob orçamento'}</span></div>
                {price.due != null ? <><div><span className="label">Pagamento agora</span><span>{formatBRL(price.due)}</span></div><div><span className="label">Saldo no dia</span><span>{formatBRL((price.total ?? 0) - price.due)}</span></div></> : null}
              </div>
              {service === 'projeto' && config.allowFull ? (
                <fieldset style={{ border: 0, margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <legend style={{ fontWeight: 600, paddingBottom: 8 }}>Quanto pagar agora</legend>
                  <Option checked={chargeMode === 'sinal'} onChange={() => setChargeMode('sinal')} title="Somente o sinal" price={formatBRL(price.dep)} desc="O saldo é pago no dia da sessão." />
                  <Option checked={chargeMode === 'integral'} onChange={() => setChargeMode('integral')} title="Valor integral" price={formatBRL(price.total)} desc="Nada a pagar no dia." />
                </fieldset>
              ) : null}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--muted)', fontSize: 15 }}>
                <strong style={{ color: 'var(--fg)' }}>Política de cancelamento</strong>
                <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{config.cancellationPolicy}</p>
                {price.quote ? <p style={{ margin: 0 }}>Peças grandes precisam de avaliação. Você recebe valor, duração e datas antes de qualquer pagamento.</p>
                  : <p style={{ margin: 0 }}>O horário fica reservado por {config.holdMinutes} minutos enquanto você paga. Ele só é confirmado depois que o pagamento for aprovado.</p>}
              </div>
              <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /><span>Li e concordo com a política de cancelamento, as condições da reserva e a <a href="/politicas" target="_blank">política de privacidade</a>.</span></label>
            </div>
          ) : null}

          {step === 5 && done ? (
            <div className="step-panel" key="s5">
              {done.checkoutUrl ? (
                <>
                  <span className="status" style={{ color: 'var(--t-warn)', alignSelf: 'flex-start' }}>Aguardando pagamento</span>
                  <h2 className="h3">Abrindo o Mercado Pago…</h2>
                  <p className="muted" style={{ margin: 0 }}>Se a página não abrir, use o botão abaixo. O horário fica reservado por {config.holdMinutes} minutos.</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}><a className="btn btn-accent" href={done.checkoutUrl}>Ir para o pagamento</a><a className="btn btn-ghost" href={`/reserva/${done.token}`}>Acompanhar reserva</a></div>
                </>
              ) : (
                <>
                  <span className="status" style={{ color: 'var(--t-info)', alignSelf: 'flex-start' }}>Solicitação recebida</span>
                  <h2 className="h3">Vou avaliar sua ideia.</h2>
                  <p className="muted" style={{ margin: 0 }}>Você recebe valor, duração e horários sugeridos por e-mail em até 3 dias úteis.</p>
                  <a className="btn btn-ghost" style={{ alignSelf: 'flex-start' }} href={`/reserva/${done.token}`}>Acompanhar pedido</a>
                </>
              )}
            </div>
          ) : null}

          {step < 5 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, borderTop: '1px solid var(--line)', paddingTop: 20 }}>
              <button type="button" className="btn btn-ghost" disabled={step === 1 || busy} onClick={() => go(step === 4 && price.quote ? 2 : step - 1)}>Voltar</button>
              <button type="button" className="btn btn-accent" disabled={busy} onClick={next}>
                {busy ? <><Loader2 size={16} className="animate-spin" aria-hidden /> Enviando…</> : step === 4 ? (price.quote ? 'Enviar para orçamento' : `Pagar ${formatBRL(price.due)}`) : 'Continuar'}
              </button>
            </div>
          ) : null}
        </div>

        <aside className="booking-aside" aria-label="Resumo">
          <div className="summary">
            <div><span className="label">Resumo</span></div>
            <div style={{ flexDirection: 'column', gap: 2 }}>
              <strong>{price.label}</strong>
              <span className="small">{price.quote ? 'Data a combinar após orçamento' : slot ? new Date(slot.startsAt).toLocaleString('pt-BR', { timeZone: 'America/Recife', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : 'Data a escolher'}</span>
              {price.minutes ? <span className="small">Duração estimada: {formatDuration(price.minutes)}</span> : null}
            </div>
            {price.total != null ? (
              <>
                <div><span>{price.estimate ? 'Valor estimado' : 'Valor total'}</span><strong>{price.estimate ? 'a partir de ' : ''}{formatBRL(price.total)}</strong></div>
                <div><span>{service === 'consulta' ? 'Pagamento integral' : chargeMode === 'integral' && service === 'projeto' ? 'Pagando agora (integral)' : `Sinal (${config.depositPercent}%)`}</span><span>{formatBRL(price.due)}</span></div>
                <div><span>Saldo no dia</span><span>{formatBRL(price.total - (price.due ?? 0))}</span></div>
              </>
            ) : <div><span>Valor</span><strong>Sob orçamento</strong></div>}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Option({ checked, onChange, title, price, desc }: { checked: boolean; onChange: () => void; title: string; price: string; desc: string }) {
  return (
    <label className="option">
      <input type="radio" checked={checked} onChange={onChange} />
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}><strong style={{ fontSize: 17 }}>{title}</strong><span className="small">{price}</span></span>
        <span className="muted">{desc}</span>
      </span>
    </label>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}{hint ? <small> — {hint}</small> : null}</span>
      {children}
      {error ? <p className="err" role="alert">{error}</p> : null}
    </label>
  );
}
