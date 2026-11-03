'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const ITEMS = [
  ['/admin', 'Visão geral'], ['/admin/pagina-inicial', 'Página inicial'], ['/admin/agenda', 'Agenda'], ['/admin/clientes', 'Clientes'], ['/admin/pagamentos', 'Pagamentos'], ['/admin/financeiro', 'Resumo financeiro'], ['/admin/portfolio', 'Portfólio'],
  ['/admin/projetos', 'Projetos'], ['/admin/estilos', 'Estilos'], ['/admin/depoimentos', 'Depoimentos'], ['/admin/disponibilidade', 'Horários e bloqueios'], ['/admin/configuracoes', 'Preços e configurações']
];

export function AdminNav() {
  const path = usePathname();
  // no celular o menu vira uma faixa que rola de lado: mantém a tela atual à vista
  useEffect(() => {
    document.querySelector<HTMLElement>('.admin-nav a[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [path]);
  return (
    <>
      {ITEMS.map(([href, label]) => (
        <Link key={href} href={href} aria-current={(href === '/admin' ? path === href : path.startsWith(href)) ? 'page' : undefined}>{label}</Link>
      ))}
    </>
  );
}
