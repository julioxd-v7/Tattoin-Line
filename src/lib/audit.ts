import 'server-only';
import { serviceClient } from './supabase/admin';

export async function audit(artistId: string, actorId: string | null, action: string, entity: string, entityId: string | null, data: Record<string, unknown> = {}) {
  const { error } = await serviceClient().from('admin_audit_log').insert({ artist_id: artistId, actor_id: actorId, action, entity, entity_id: entityId, data });
  if (error) console.error('audit', error.message);
}

export async function appointmentEvent(appointmentId: string, type: string, actor: string, data: Record<string, unknown> = {}) {
  const { error } = await serviceClient().from('appointment_events').insert({ appointment_id: appointmentId, type, actor, data });
  if (error) console.error('appointment_event', error.message);
}
