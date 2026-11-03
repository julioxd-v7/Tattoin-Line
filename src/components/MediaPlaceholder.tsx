/**
 * Espaço neutro reservado para uma foto que o tatuador ainda vai enviar pelo painel.
 * Mantém o layout montado: marcas de canto finas e um rótulo discreto.
 * Nunca mostra imagem gerada ou de banco de imagens.
 */
export function MediaPlaceholder({ label, ratio, className }: { label: string; ratio?: string; className?: string }) {
  return (
    <div className={`media-ph${className ? ` ${className}` : ''}`} role="img" aria-label={`Espaço reservado: ${label.toLowerCase()}`}>
      <span className="media-ph-corner" data-c="tl" aria-hidden="true" />
      <span className="media-ph-corner" data-c="tr" aria-hidden="true" />
      <span className="media-ph-corner" data-c="bl" aria-hidden="true" />
      <span className="media-ph-corner" data-c="br" aria-hidden="true" />
      <span className="media-ph-label label" aria-hidden="true">
        {label}{ratio ? <span className="media-ph-ratio">{ratio}</span> : null}
      </span>
    </div>
  );
}
