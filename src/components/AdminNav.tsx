'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  ['/admin', 'Visão geral'], ['/admin/pagina-inicial', 'Página inicial'], ['/admin/agenda', 'Agenda'], ['/admin/clientes', 'Clientes'], ['/admin/pagamentos', 'Pagamentos'], ['/admin/financeiro', 'Resumo financeiro'], ['/admin/portfolio', 'Portfólio'],
  ['/admin/projetos', 'Projetos'], ['/admin/estilos', 'Estilos'], ['/admin/depoimentos', 'Depoimentos'], ['/admin/disponibilidade', 'Horários e bloqueios'], ['/admin/configuracoes', 'Preços e configurações']
];

export function AdminNav() {
  const path = usePathname();
  return (
    <>
      {ITEMS.map(([href, label]) => (
        <Link key={href} href={href} aria-current={(href === '/admin' ? path === href : path.startsWith(href)) ? 'page' : undefined}>{label}</Link>
      ))}
    </>
  );
}
