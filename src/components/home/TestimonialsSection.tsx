import { TestimonialsCarousel, type TestimonialItem } from './TestimonialsCarousel';

interface Props {
  items: TestimonialItem[];
  index: number;
  sectionCount: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * "O que nossos clientes dizem". Só depoimentos reais, publicados com autorização do cliente
 * (Painel → Depoimentos). Sem nenhum, a página decide pela configuração do artista: ocultar
 * a seção (padrão) ou mostrá-la com o aviso discreto abaixo.
 */
export function TestimonialsSection({ items, index, sectionCount }: Props) {
  return (
    <section className="section testimonials-band" aria-labelledby="dep-title">
      <div className="container testimonials-grid">
        <header className="testimonials-intro" data-rv="up">
          <span className="index" aria-hidden="true">{pad(index)} / {pad(sectionCount)}</span>
          <p className="eyebrow">Depoimentos</p>
          <h2 id="dep-title" className="h2">O que nossos<br />clientes dizem</h2>
        </header>
        <div className="testimonials-body" data-rv="up">
          {items.length ? (
            <TestimonialsCarousel items={items} />
          ) : (
            <p className="small testimonials-empty">Os depoimentos de clientes aparecem aqui quando forem publicados.</p>
          )}
        </div>
      </div>
    </section>
  );
}
