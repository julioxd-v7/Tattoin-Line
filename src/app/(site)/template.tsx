/** Recriado a cada navegação: o conteúdo novo entra com a animação .page-enter. */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
