import { Clock, Gem, MapPin, Sparkle, type LucideIcon } from 'lucide-react';

/** Diferenciais do estúdio. Para mudar os textos, edite esta lista. */
const ITEMS: { icon: LucideIcon; label: [string, string?] }[] = [
  { icon: Sparkle, label: ['Desenhos', 'autorais'] },
  { icon: Gem, label: ['Atendimento', 'personalizado'] },
  { icon: MapPin, label: ['Localização', 'confirmada'] },
  { icon: Clock, label: ['Agendamento', 'online'] }
];

/** Faixa logo abaixo do topo: quatro diferenciais separados por fios verticais. */
export function FeatureStrip() {
  return (
    <section className="features" aria-label="Diferenciais do estúdio">
      <ul className="container features-list">
        {ITEMS.map(({ icon: Icon, label }, i) => (
          <li key={label.join(' ')} className="feature" data-rv="up" style={{ ['--d' as string]: `${i * 80}ms` }}>
            <Icon className="feature-icon" size={22} strokeWidth={1.25} aria-hidden />
            <span className="feature-label">{label[0]}{label[1] ? <><br />{label[1]}</> : null}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
