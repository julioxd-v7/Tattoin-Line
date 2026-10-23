import { requireAdmin } from '@/lib/admin';
import { getArtist, getSettings } from '@/lib/data';
import { ActionForm, Submit } from '@/components/ActionForm';
import { saveSettings } from '@/app/admin/actions';

const money = (c: number | null) => (c == null ? '' : (c / 100).toFixed(2).replace('.', ','));

export default async function Configuracoes() {
  await requireAdmin();
  const [s, artist] = await Promise.all([getSettings(), getArtist()]);
  const tiers = s.size_tiers.map((t) => `${t.label} | ${t.from_cents == null ? '-' : money(t.from_cents)} | ${t.minutes ?? '-'}`).join('\n');
  const F = ({ label, name, value, type = 'text', hint }: { label: string; name: string; value: string | number | null; type?: string; hint?: string }) => (
    <label className="field"><span>{label}{hint ? <small> — {hint}</small> : null}</span><input className="input" name={name} type={type} defaultValue={value ?? ''} /></label>
  );
  return (
    <>
      <h1 className="h2">Preços e configurações</h1>
      <ActionForm action={saveSettings} style={{ gap: 24 }}>
        <section className="panel"><h2>Preços e sinal</h2><div className="panel-body">
          <div className="form-grid">
            <F label="Sessão mínima (R$)" name="min_session" value={money(s.min_session_cents)} />
            <F label="Valor por hora (R$)" name="hourly_rate" value={money(s.hourly_rate_cents)} hint="vazio = não exibir" />
            <F label="Sinal (%)" name="deposit_percent" type="number" value={s.deposit_percent} />
            <F label="Sinal mínimo (R$)" name="deposit_min" value={money(s.deposit_min_cents)} />
          </div>
          <label className="check"><input type="checkbox" name="allow_full_payment" defaultChecked={s.allow_full_payment} /> <span>Permitir pagamento integral de projetos autorais</span></label>
          <label className="field"><span>Faixas por tamanho <small>— uma por linha: Rótulo | valor inicial | minutos (use “-” para “Solicitar orçamento”)</small></span><textarea className="textarea" name="size_tiers" defaultValue={tiers} style={{ fontFamily: 'ui-monospace, monospace' }} /></label>
          <div className="form-grid">
            <label className="check" style={{ alignSelf: 'end' }}><input type="checkbox" name="consult_enabled" defaultChecked={s.consult_enabled} /> <span>Oferecer consulta de avaliação</span></label>
            <F label="Valor da consulta (R$)" name="consult_price" value={money(s.consult_price_cents)} />
            <F label="Duração da consulta (min)" name="consult_minutes" type="number" value={s.consult_minutes} />
          </div>
          <label className="field"><span>Formas de pagamento (texto)</span><input className="input" name="payment_methods_text" defaultValue={s.payment_methods_text} /></label>
          <label className="field"><span>Regras de orçamento personalizado</span><textarea className="textarea" name="quote_rules_text" defaultValue={s.quote_rules_text} /></label>
        </div></section>
        <section className="panel"><h2>Agenda</h2><div className="panel-body"><div className="form-grid">
          <F label="Reserva temporária (min)" name="hold_minutes" type="number" value={s.hold_minutes} hint="tempo para pagar" />
          <F label="Intervalo entre sessões (min)" name="buffer_minutes" type="number" value={s.buffer_minutes} />
          <F label="Antecedência para reagendar (h)" name="reschedule_min_hours" type="number" value={s.reschedule_min_hours} />
          <F label="Agenda aberta por (dias)" name="booking_window_days" type="number" value={s.booking_window_days} />
        </div></div></section>
        <section className="panel"><h2>Identidade</h2><div className="panel-body">
          <div className="form-grid">
            <F label="Nome do site / estúdio" name="brand_name" value={s.brand_name} hint="aparece no topo, no rodapé e na aba do navegador" />
            <F label="Nome do artista" name="artist_name" value={artist.name} />
          </div>
          <label className="field"><span>Descrição para o Google e ao compartilhar <small>— até 300 caracteres. Vazio = usa a frase de apresentação</small></span><textarea className="textarea" name="seo_description" defaultValue={s.seo_description ?? ''} maxLength={300} placeholder="ex.: Fine line e blackwork autoral em Recife. Veja o portfólio, os projetos disponíveis e agende sua sessão." /></label>
          <label className="field"><span>Mensagem pronta do botão de WhatsApp <small>— opcional</small></span><input className="input" name="whatsapp_message" defaultValue={s.whatsapp_message ?? ''} maxLength={300} placeholder="Olá! Vi seu site e quero fazer uma tatuagem." /></label>
        </div></section>
        <section className="panel"><h2>Conteúdo</h2><div className="panel-body">
          <F label="Título principal" name="hero_title" value={s.hero_title} />
          <label className="field"><span>Frase de apresentação</span><textarea className="textarea" name="hero_subtitle" defaultValue={s.hero_subtitle} /></label>
          <label className="field"><span>Sobre mim</span><textarea className="textarea" name="about" defaultValue={s.about} /></label>
          <div className="form-grid">
            <F label="Especialidades" name="specialties" value={s.specialties.join(', ')} hint="separadas por vírgula" />
            <label className="field"><span>Cor de destaque</span><input className="input" type="color" name="accent_color" defaultValue={s.accent_color} style={{ padding: 4 }} /></label>
          </div>
        </div></section>
        <section className="panel"><h2>Contato e dados comerciais</h2><div className="panel-body"><div className="form-grid">
          <F label="E-mail de contato" name="contact_email" type="email" value={s.contact_email} />
          <F label="WhatsApp" name="whatsapp" value={s.whatsapp} hint="com DDI e DDD" />
          <F label="Instagram" name="instagram" value={s.instagram} />
          <F label="Endereço" name="address" value={s.address} />
          <F label="Cidade" name="city" value={s.city} />
          <F label="Dados comerciais" name="business_info" value={s.business_info} hint="ex.: CNPJ" />
        </div></div></section>
        <section className="panel"><h2>Políticas</h2><div className="panel-body">
          <label className="field"><span>Cancelamento e reagendamento</span><textarea className="textarea" name="cancellation_policy" defaultValue={s.cancellation_policy} /></label>
          <label className="field"><span>Privacidade (LGPD)</span><textarea className="textarea" name="privacy_policy" defaultValue={s.privacy_policy} style={{ minHeight: 180 }} /></label>
        </div></section>
        <Submit>Salvar configurações</Submit>
      </ActionForm>
    </>
  );
}
