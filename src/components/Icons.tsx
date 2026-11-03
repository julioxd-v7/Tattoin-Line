import type { SVGProps } from 'react';
import { ART } from '@/lib/art';

/**
 * Marca do estúdio: estrela de quatro pontas em traço fino, usada ao lado do nome.
 * Troque este desenho pelo logotipo do tatuador quando houver um.
 */
export function BrandMark({ size = 28, ...p }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1} strokeLinejoin="round" className="brand-mark" {...p}>
      <path d="M16 1.5 L18.2 13.8 L30.5 16 L18.2 18.2 L16 30.5 L13.8 18.2 L1.5 16 L13.8 13.8 Z" />
      <path d="M16 7 L16 25 M7 16 L25 16" strokeWidth={0.6} />
    </svg>
  );
}

export function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3a2.6 2.6 0 0 0-.8 1.9 4.5 4.5 0 0 0 .9 2.4 10.3 10.3 0 0 0 4 3.5c1.5.6 2 .7 2.7.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>
  );
}

export function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round"><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.4 2.6 2.2 4.5 5 4.8" /></svg>
  );
}

export function LineArt({ path, stroke = 'currentColor', width = 1.3, className, style }: { path: string; stroke?: string; width?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d={path} />
    </svg>
  );
}


export { ART };
