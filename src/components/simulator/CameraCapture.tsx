'use client';
import { useEffect, useRef, useState } from 'react';
import { photoFromVideo } from '@/lib/simulator-dom';

/** Câmera do aparelho (traseira por padrão). A imagem fica só na memória. */
export function CameraCapture({ onCapture, onClose }: { onCapture: (c: HTMLCanvasElement) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    setReady(false);
    setError('');
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error(), { name: 'NotSupported' });
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1440 } },
          audio: false
        });
        if (!alive) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) { v.srcObject = stream; await v.play().catch(() => undefined); }
      } catch (e) {
        const name = (e as Error).name;
        setError(
          name === 'NotAllowedError' ? 'Permissão da câmera negada. Libere o acesso nas configurações do navegador ou envie uma foto.'
            : name === 'NotFoundError' || name === 'OverconstrainedError' ? 'Nenhuma câmera encontrada neste aparelho.'
            : name === 'NotSupported' ? 'Este navegador não permite usar a câmera aqui. Envie uma foto da galeria.'
            : 'Não foi possível abrir a câmera. Tente enviar uma foto.'
        );
      }
    })();
    return () => {
      alive = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function capture() {
    try {
      const c = photoFromVideo(videoRef.current!);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      onCapture(c);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="sim-camera" role="dialog" aria-modal="true" aria-label="Tirar foto">
      <video ref={videoRef} playsInline muted onLoadedData={() => setReady(true)} className={facing === 'user' ? 'mirror' : undefined} />
      {error ? <p className="alert alert-bad" role="alert">{error}</p> : null}
      <div className="sim-camera-bar">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
        <button type="button" className="sim-shutter" onClick={capture} disabled={!ready} aria-label="Tirar foto" />
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}>Virar câmera</button>
      </div>
    </div>
  );
}
