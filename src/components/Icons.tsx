import type { SVGProps } from 'react';
import { ART, SKULL_BIG } from '@/lib/art';

export function SkullIcon({ size = 26, ...p }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3C7.6 3 5 6 5 10c0 2.4 1.2 4 2.5 4.8V17a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-2.2C17.8 14 19 12.4 19 10c0-4-2.6-7-7-7Z" />
      <circle cx="9.3" cy="10.5" r="1.6" />
      <circle cx="14.7" cy="10.5" r="1.6" />
      <path d="M12 12.6l-.9 1.8h1.8Z M10 18v-2 M12 18v-2 M14 18v-2" />
    </svg>
  );
}

export function LineArt({ path, stroke = 'currentColor', width = 1.3, className, style }: { path: string; stroke?: string; width?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d={path} />
    </svg>
  );
}

export function BigSkull({ stroke, width = 2, className, style }: { stroke: string; width?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 220" fill="none" stroke={stroke} strokeWidth={width} className={className} style={style}>
      {SKULL_BIG.map((d) => <path key={d} d={d} />)}
    </svg>
  );
}

export function HeroSkull() {
  return (
    <svg className="float" role="img" aria-label="Ilustração: caveira com rosas" viewBox="0 0 200 220" width="92%" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      {SKULL_BIG.map((d) => <path key={d} d={d} />)}
      <path d="M100 20 L104 34 L98 44 L103 56" strokeWidth={1.1} />
      <path d="M56 142 C64 146 70 150 72 156 M144 142 C136 146 130 150 128 156" />
      <path d="M150 196 C138 188 140 170 154 168 C168 166 176 180 168 192 C163 200 152 202 150 196 Z M155 175 C150 181 156 189 164 184 M152 186 C158 192 166 190 168 184" stroke="#e0644f" />
      <path d="M160 200 C166 210 178 214 190 210 M172 210 C176 202 184 200 190 202 M30 200 C44 196 54 200 62 208 M44 198 C42 190 36 186 28 188" stroke="#e0644f" strokeWidth={1.3} />
    </svg>
  );
}

export { ART };
