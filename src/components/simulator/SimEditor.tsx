'use client';
/**
 * Palco do simulador (Konva). Carregado só no navegador via next/dynamic.
 * Recebe o estado normalizado (relativo à foto) e devolve o novo estado
 * ao fim de cada gesto: arrastar, redimensionar, girar ou pinçar.
 */
import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KImage, Transformer } from 'react-konva';
import Konva from 'konva';
import { fitContain, fromStage, toStage, type Transform } from '@/lib/simulator';

Konva.hitOnDragEnabled = true; // permite pinça enquanto arrasta

interface Props {
  photo: HTMLCanvasElement;
  art: HTMLImageElement | null;
  value: Transform;
  hideArt?: boolean;
  onCommit: (t: Transform) => void;
}

export default function SimEditor({ photo, art, value, hideArt, onCommit }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [selected, setSelected] = useState(true);
  const pinch = useRef<{ dist: number; angle: number; width: number; rotation: number } | null>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: Math.floor(e.contentRect.width), h: Math.floor(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const stage = box.w > 0 && box.h > 0 ? fitContain({ w: photo.width, h: photo.height }, box) : null;
  const aspect = art ? art.naturalHeight / art.naturalWidth : 1;
  const n = stage ? toStage(value, stage, aspect) : null;

  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    tr.nodes(selected && art && !hideArt && artRef.current ? [artRef.current] : []);
    tr.getLayer()?.batchDraw();
  }, [selected, art, hideArt, n?.x, n?.y, n?.width, n?.rotation]);

  function commitFromNode() {
    const node = artRef.current;
    if (!node || !stage) return;
    const width = node.width() * Math.abs(node.scaleX());
    node.scale({ x: 1, y: 1 });
    onCommit(fromStage({ x: node.x(), y: node.y(), width, rotation: node.rotation() }, stage, value.opacity));
  }

  function onTouchMove(e: Konva.KonvaEventObject<TouchEvent>) {
    const touches = e.evt.touches;
    const node = artRef.current;
    if (touches.length !== 2 || !node) return;
    e.evt.preventDefault();
    if (node.isDragging()) node.stopDrag();
    const [a, b] = [touches[0], touches[1]];
    const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
    const angle = (Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX) * 180) / Math.PI;
    if (!pinch.current) {
      pinch.current = { dist, angle, width: node.width(), rotation: node.rotation() };
      return;
    }
    const p = pinch.current;
    const k = dist / p.dist;
    node.scale({ x: k, y: k });
    node.rotation(p.rotation + (angle - p.angle));
    node.getLayer()?.batchDraw();
  }

  function onTouchEnd() {
    if (pinch.current) {
      pinch.current = null;
      commitFromNode();
    }
  }

  return (
    <div className="sim-stage-box" ref={boxRef}>
      {stage && n ? (
        <Stage
          width={stage.w}
          height={stage.h}
          className="sim-stage"
          onMouseDown={(e) => setSelected((e.target as unknown) === artRef.current)}
          onTouchStart={(e) => { if (e.evt.touches.length === 1) setSelected((e.target as unknown) === artRef.current); }}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <Layer listening={false}>
            <KImage image={photo} width={stage.w} height={stage.h} />
          </Layer>
          <Layer>
            {art && !hideArt ? (
              <KImage
                ref={artRef}
                image={art}
                x={n.x}
                y={n.y}
                width={n.width}
                height={n.height}
                offsetX={n.width / 2}
                offsetY={n.height / 2}
                rotation={n.rotation}
                opacity={n.opacity}
                globalCompositeOperation="multiply"
                draggable
                dragBoundFunc={(pos) => ({ x: Math.min(stage.w, Math.max(0, pos.x)), y: Math.min(stage.h, Math.max(0, pos.y)) })}
                onDragStart={() => setSelected(true)}
                onDragEnd={commitFromNode}
                onTransformEnd={commitFromNode}
                onMouseEnter={(e) => { const c = e.target.getStage()?.container(); if (c) c.style.cursor = 'move'; }}
                onMouseLeave={(e) => { const c = e.target.getStage()?.container(); if (c) c.style.cursor = 'default'; }}
              />
            ) : null}
            <Transformer
              ref={trRef}
              keepRatio
              rotateEnabled
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
              anchorSize={16}
              anchorCornerRadius={8}
              anchorStroke="#a3342a"
              anchorFill="#fff8f2"
              borderStroke="#a3342a"
              borderDash={[6, 4]}
              rotateAnchorOffset={28}
              rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
              rotationSnapTolerance={4}
              boundBoxFunc={(oldBox, newBox) => (Math.abs(newBox.width) < 24 || Math.abs(newBox.height) < 24 ? oldBox : newBox)}
            />
          </Layer>
        </Stage>
      ) : null}
    </div>
  );
}
