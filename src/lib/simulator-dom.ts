/**
 * Funções do simulador que dependem do navegador (canvas, imagens, câmera).
 * Nada aqui envia arquivos para a internet: tudo fica na memória do aparelho.
 */
import { downscale, sniffImage, validateDimensions, validateFile, type Transform } from './simulator';

export type Photo = HTMLCanvasElement;

async function head(file: Blob) {
  return new Uint8Array(await file.slice(0, 16).arrayBuffer());
}

/** Desenha a fonte num canvas já reduzido (lado maior ≤ 2400 px). */
function toCanvas(src: CanvasImageSource, w: number, h: number): HTMLCanvasElement {
  const d = downscale(w, h);
  const c = document.createElement('canvas');
  c.width = d.w;
  c.height = d.h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('Seu navegador não permite editar imagens.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, d.w, d.h);
  return c;
}

function loadImg(url: string, cors = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (cors) img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Não foi possível abrir a imagem.'));
    img.src = url;
  });
}

/** Foto do cliente: confere o conteúdo, corrige a orientação (EXIF) e reduz. */
export async function photoFromFile(file: File): Promise<Photo> {
  const err = validateFile(file.size, sniffImage(await head(file)), 'photo');
  if (err) throw new Error(err);
  let canvas: HTMLCanvasElement;
  if ('createImageBitmap' in window) {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const dim = validateDimensions(bmp.width, bmp.height, 'photo');
    if (dim) { bmp.close(); throw new Error(dim); }
    canvas = toCanvas(bmp, bmp.width, bmp.height);
    bmp.close();
  } else {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImg(url); // navegadores atuais já aplicam a orientação EXIF em <img>
      const dim = validateDimensions(img.naturalWidth, img.naturalHeight, 'photo');
      if (dim) throw new Error(dim);
      canvas = toCanvas(img, img.naturalWidth, img.naturalHeight);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return canvas;
}

export function photoFromVideo(video: HTMLVideoElement): Photo {
  if (!video.videoWidth) throw new Error('A câmera ainda não está pronta.');
  return toCanvas(video, video.videoWidth, video.videoHeight);
}

/** Desenho do artista (PNG público do Supabase). */
export function artFromUrl(url: string) {
  return loadImg(url, true);
}

/** Desenho do próprio cliente: só PNG/WebP (precisa de transparência). Não é enviado. */
export async function artFromFile(file: File): Promise<{ img: HTMLImageElement; revoke: () => void }> {
  const err = validateFile(file.size, sniffImage(await head(file)), 'art');
  if (err) throw new Error(err);
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImg(url);
    const dim = validateDimensions(img.naturalWidth, img.naturalHeight, 'art');
    if (dim) throw new Error(dim);
    return { img, revoke: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

/**
 * Gera a imagem final na resolução da foto, sem alças nem botões,
 * a partir do estado normalizado (o mesmo que o editor usa).
 */
export function renderComposite(photo: Photo, art: HTMLImageElement, t: Transform, caption: string): Promise<Blob> {
  const W = photo.width;
  const H = photo.height;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(photo, 0, 0);
  const w = t.scale * W;
  const h = w * (art.naturalHeight / art.naturalWidth);
  ctx.save();
  ctx.translate(t.x * W, t.y * H);
  ctx.rotate((t.rotation * Math.PI) / 180);
  ctx.globalAlpha = t.opacity;
  ctx.globalCompositeOperation = 'multiply'; // o traço "entra" na pele em vez de flutuar por cima
  ctx.drawImage(art, -w / 2, -h / 2, w, h);
  ctx.restore();
  // aviso discreto: é uma prévia, não o resultado final
  const fs = Math.max(12, Math.round(W / 60));
  ctx.font = `500 ${fs}px system-ui, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  const pad = Math.round(fs * 0.8);
  const tw = ctx.measureText(caption).width;
  ctx.fillRect(W - tw - pad * 2, H - fs - pad * 1.6, tw + pad * 2, fs + pad * 1.6);
  ctx.fillStyle = '#fff';
  ctx.fillText(caption, W - pad, H - pad * 0.8);
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('Não foi possível gerar a imagem.'))), 'image/png'));
}
