import type { Metadata } from 'next';
import { FlashCard } from '@/components/Cards';
import { BigSkull } from '@/components/Icons';
import { getFlashProjects, getSettings, publicImageUrl } from '@/lib/data';

export const revalidate = 120;
export const metadata: Metadata = { title: 'Projetos disponíveis', description: 'Flash autoral com preço fechado, tatuado uma única vez. Reserve o seu.', alternates: { canonical: '/projetos' } };

export default async function Projetos() {
  const [list, s] = await Promise.all([getFlashProjects({ includeSold: true }), getSettings()]);
  const count = (st: string) => list.filter((f) => f.status === st).length;
  return (
    <>
      <div className="wrap">
        <div className="page-head">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><p className="eyebrow">Flash autoral · tatuados uma única vez</p><h1>Projetos disponíveis</h1></div>
          <p className="lead" style={{ justifySelf: 'end' }}>Preço fechado, tamanho e duração já definidos. Para reservar, você paga um sinal de {s.deposit_percent}%{s.allow_full_payment ? ' ou o valor integral' : ''}; o desenho fica separado por {s.hold_minutes} minutos enquanto conclui o pagamento.</p>
        </div>
      </div>
      <section className="paper section" style={{ paddingTop: 64 }} aria-labelledby="cat">
        <BigSkull stroke="currentColor" className="bg-skull" style={{ position: 'absolute', left: -140, bottom: -80, width: 480, opacity: 0.06 }} />
        <div className="wrap" style={{ position: 'relative' }}>
          <div className="section-head"><h2 className="h3" id="cat">Catálogo</h2><span className="small">{count('disponivel')} disponíveis · {count('reservado')} reservados · {count('vendido')} já tatuados</span></div>
          {list.length ? <div className="grid">{list.map((f, i) => <FlashCard key={f.id} project={f} index={i} imageUrl={publicImageUrl(f.image_path)} />)}</div> : <p className="lead">Nenhum projeto publicado no momento.</p>}
        </div>
      </section>
      <section className="section" aria-labelledby="como">
        <div className="wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(260px,100%),1fr))', gap: 32 }}>
          <h2 className="h3" id="como" data-rv="left">Como funciona a reserva</h2>
          <div data-rv="up"><strong>Escolha o projeto e o horário</strong><p className="muted">A disponibilidade é conferida no momento da reserva.</p></div>
          <div data-rv="up" style={{ ['--d' as string]: '90ms' }}><strong>Pague o sinal</strong><p className="muted">PIX ou cartão pelo Mercado Pago. A sessão só é confirmada após a aprovação do pagamento.</p></div>
          <div data-rv="up" style={{ ['--d' as string]: '180ms' }}><strong>O desenho sai do catálogo</strong><p className="muted">Depois de tatuado, não é repetido.</p></div>
        </div>
      </section>
    </>
  );
}
