'use client';
import { useFormState, useFormStatus } from 'react-dom';
import type { ActionState } from '@/app/admin/actions';

type Action = (state: ActionState, form: FormData) => Promise<ActionState>;

export function ActionForm({ action, children, className, style }: { action: Action; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const [state, formAction] = useFormState(action, null);
  return (
    <form action={formAction} className={className} style={{ display: 'flex', flexDirection: 'column', gap: 16, ...style }}>
      {state?.error ? <p className="alert alert-bad" role="alert">{state.error}</p> : null}
      {state?.ok ? <p className="alert alert-ok" role="status">{state.ok}</p> : null}
      {children}
    </form>
  );
}

export function Submit({ children, className = 'btn btn-accent' }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={className} disabled={pending} style={{ alignSelf: 'flex-start' }}>{pending ? 'Salvando…' : children}</button>;
}
