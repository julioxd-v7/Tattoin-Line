import type { Metadata } from 'next';
import Link from 'next/link';
import { getSettings } from '@/lib/data';
import { depositFor } from '@/lib/pricing';
import { formatBRL, formatBRLShort, formatDuration } from '@/lib/money';

export const revalidate = 300;
export const metadata: Metadata = { title: 'Preços', description: 'Valores de referência, sinal para reserva e formas de pagamento.', alternates: { canonical: '/precos' } };

export default async function Precos() {
  const s = await getSettings();
  const example = s.size_tiers.find((t) => t.from_cents)?.from_cents ?? s.min_session_cents;
  const dep = depositFor(example, s);
  return (
    <div className="wrap">
      <div className="page-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><p className="eyebrow">Valores de referência</p><h1>Preços</h1></div>
        <p className="lead" style={{ justifySelf: 'end' }}>Cada tatuagem tem um tempo e uma complexidade próprios. O valor final de um desenho personalizado é confirmado no orçamento, antes de qualquer pagamento.</p>
      </div>
      <div className="tiers" data-rv="up">
        <div><span className="small">Sessão mínima</span><span className="tier-value">{formatBRLShort(s.min_session_cents)}</span><span className="muted">Peças pequenas. Inclui desenho e material.</span></div>
        {s.hourly_rate_cents ? <div><span className="small">Valor por hora</span><span className="tier-value">{formatBRLShort(s.hourly_rate_cents)}<span style={{ fontSize: 22 }}>/h</span></span><span className="muted">Fechamentos e peças grandes em várias sessões.</span></div> : null}
        <div><span className="small">Projetos autorais</span><span className="tier-value">Preço fixo</span><span className="muted">Cada flash tem valor fechado. <Link href="/projetos">Ver projetos</Link></span></div>
        {s.consult_enabled ? <div><span className="small">Consulta de avaliação</span><span className="tier-value">{formatBRLShort(s.consult_price_cents)}</span><span className="muted">{formatDuration(s.consult_minutes)}, paga integralmente na reserva.</span></div> : null}
      </div>
      <section style={{ paddingBlock: 72 }} aria-labelledby="faixas">
        <h2 className="h2" id="faixas" data-rv="left" style={{ marginBottom: 24 }}>Por tamanho</h2>
        <div className="table-wrap" data-rv="up">
          <table>
            <thead><tr><th scope="col">Tamanho</th><th scope="col">Duração estimada</th><th scope="col">Valor</th><th scope="col">Sinal para reservar</th></tr></thead>
            <tbody>
              {s.size_tiers.map((t) => (
                <tr key={t.id}>
                  <th scope="row">{t.label}</th>
                  <td>{t.minutes ? `≈ ${formatDuration(t.minutes)}` : 'Várias sessões'}</td>
                  <td>{t.from_cents ? `A partir de ${formatBRLShort(t.from_cents)}` : <Link href="/agendar">Solicitar orçamento</Link>}</td>
                  <td>{t.from_cents ? formatBRL(depositFor(t.from_cents, s)) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(380px,100%),1fr))', gap: 48, alignItems: 'start', paddingBottom: 72 }} aria-labelledby="sinal">
        <div data-rv="left" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 className="h2" id="sinal">Sinal e saldo</h2>
          <p className="muted" style={{ margin: 0 }}>Para reservar o horário é cobrado um sinal de <strong style={{ color: 'var(--fg)' }}>{s.deposit_percent}% do valor</strong> (mínimo de {formatBRL(s.deposit_min_cents)}). O sinal é descontado do total; o saldo é pago no dia da sessão.</p>
          <p className="muted" style={{ margin: 0 }}>Se o valor mudar por decisão sua durante a sessão, a diferença é combinada antes de começar.</p>
        </div>
        <div className="summary" data-rv="right">
          <div><span className="label">Exemplo</span></div>
          <div><span>Valor estimado</span><strong>{formatBRL(example)}</strong></div>
          <div><span>Sinal agora</span><span>{formatBRL(dep)}</span></div>
          <div><span>Saldo no dia</span><span>{formatBRL(example - dep)}</span></div>
        </div>
      </section>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(260px,100%),1fr))', gap: 32, borderTop: '1px solid var(--line)', paddingBlock: '40px 96px' }}>
        <div data-rv="up"><h2 className="h3">Pagamento</h2><p className="muted">{s.payment_methods_text}</p></div>
        <div data-rv="up" style={{ ['--d' as string]: '90ms' }}><h2 className="h3">Orçamento</h2><p className="muted">{s.quote_rules_text}</p><Link className="btn btn-accent btn-sm" href="/agendar">Solicitar orçamento</Link></div>
        <div data-rv="up" style={{ ['--d' as string]: '180ms' }}><h2 className="h3">Cancelamento</h2><p className="muted">{s.cancellation_policy} <Link href="/politicas#cancelamento">Política completa</Link></p></div>
      </section>
    </div>
  );
}
