'use client';
import { useState, type ChangeEvent } from 'react';

const MAX_SIDE = 2400;
const MIN_BYTES = 700 * 1024; // abaixo disso só reduz se a imagem for maior que 2400 px

async function shrink(file: File): Promise<File> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || typeof createImageBitmap !== 'function') return file;
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' } as unknown as ImageBitmapOptions);
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  if (scale === 1 && file.size < MIN_BYTES) { bmp.close(); return file; }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) { bmp.close(); return file; }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  // foto (JPEG) continua JPEG; PNG/WebP viram WebP para manter a transparência
  const wantType = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, wantType, wantType === 'image/jpeg' ? 0.85 : 0.9));
  if (!blob || blob.type !== wantType || blob.size >= file.size) return file; // navegador sem suporte ou não ficou menor
  const ext = wantType === 'image/jpeg' ? 'jpg' : 'webp';
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.' + ext, { type: wantType, lastModified: Date.now() });
}

const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

/**
 * Campo de imagem que reduz fotos grandes no próprio navegador antes de enviar
 * (até 2400 px, sem perder qualidade visível). Também remove dados escondidos da foto,
 * como a localização GPS do celular.
 */
export function ImageInput({ name, accept = 'image/jpeg,image/png,image/webp,image/avif', multiple, label }: { name: string; accept?: string; multiple?: boolean; label: React.ReactNode }) {
  const [note, setNote] = useState('');
  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const files = Array.from(input.files ?? []);
    if (!files.length) { setNote(''); return; }
    setNote('Otimizando imagem…');
    try {
      const out = await Promise.all(files.map((f) => shrink(f).catch(() => f)));
      const before = files.reduce((s, f) => s + f.size, 0);
      const after = out.reduce((s, f) => s + f.size, 0);
      if (after < before && typeof DataTransfer !== 'undefined') {
        const dt = new DataTransfer();
        out.forEach((f) => dt.items.add(f));
        input.files = dt.files;
        setNote(`Otimizada: ${kb(before)} → ${kb(after)}`);
      } else setNote('');
    } catch {
      setNote('');
    }
  }
  return (
    <label className="field">
      <span>{label}</span>
      <input className="input" style={{ paddingBlock: 10 }} type="file" name={name} accept={accept} multiple={multiple} onChange={onChange} />
      {note ? <small role="status">{note}</small> : null}
    </label>
  );
}
