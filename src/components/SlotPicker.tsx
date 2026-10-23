'use client';
import { useState } from 'react';

export interface SlotOption { id: string; label: string; thumb: string }

/** Espaços em ordem (4 por padrão); cada um mostra a miniatura da arte escolhida. */
export function SlotPicker({ options, initial, square, count = 4 }: { options: SlotOption[]; initial: string[]; square?: boolean; count?: number }) {
  const [vals, setVals] = useState<string[]>(Array.from({ length: count }, (_, i) => initial[i] ?? ''));
  const set = (i: number, v: string) => setVals((cur) => cur.map((x, j) => (j === i ? v : x)));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(170px, 100%), 1fr))', gap: 14 }}>
      {vals.map((v, i) => {
        const o = options.find((x) => x.id === v);
        const dup = v && vals.indexOf(v) !== i;
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ position: 'relative', aspectRatio: square ? '1 / 1' : '4 / 5', borderRadius: 8, border: `1px ${o ? 'solid' : 'dashed'} var(--line-strong)`, background: o ? `center / cover no-repeat url(${o.thumb})` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'var(--bg)', color: 'var(--fg)' }}>{i + 1}º</span>
              {o ? null : <span className="small">Vazio</span>}
            </div>
            <label className="field">
              <span className="visually-hidden">Espaço {i + 1}</span>
              <select className="select" name={`slot_${i + 1}`} value={v} onChange={(e) => set(i, e.target.value)} aria-invalid={Boolean(dup)}>
                <option value="">— vazio —</option>
                {options.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
              </select>
            </label>
            {dup ? <p className="err">Já escolhida em outro espaço.</p> : null}
          </div>
        );
      })}
    </div>
  );
}
