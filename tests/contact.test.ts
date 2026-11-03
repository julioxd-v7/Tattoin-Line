import { describe, expect, it } from 'vitest';
import { cleanEmail, cleanInstagram, cleanText, cleanWhatsapp, publicContact, socialUrl, whatsappLink } from '../src/lib/contact';

describe('dados de demonstração nunca aparecem', () => {
  it('valores do banco de demonstração (seed.sql) são descartados', () => {
    const c = publicContact({
      contact_email: 'contato@exemplo.com.br', whatsapp: '5581900000000', instagram: 'tattoinline',
      address: '[Endereço do estúdio]', business_info: 'CNPJ [00.000.000/0000-00]', city: 'Recife — PE', brand_name: 'Estúdio'
    });
    expect(c).toMatchObject({ email: null, whatsapp: null, whatsappUrl: null, instagram: null, address: null, businessInfo: null, city: 'Recife — PE' });
  });
  it('CNPJ zerado sem colchetes também é descartado', () => {
    expect(cleanText('CNPJ 00.000.000/0000-00')).toBeNull();
    expect(cleanText('CNPJ 12.345.678/0001-90')).toBe('CNPJ 12.345.678/0001-90');
  });
});

describe('WhatsApp', () => {
  it('aceita número real com ou sem máscara', () => {
    expect(cleanWhatsapp('+55 (81) 98765-4321')).toBe('5581987654321');
  });
  it('recusa curto, longo ou zerado', () => {
    expect(cleanWhatsapp('12345')).toBeNull();
    expect(cleanWhatsapp('5581900000000')).toBeNull();
    expect(cleanWhatsapp(null)).toBeNull();
  });
  it('monta o link com a mensagem', () => {
    expect(whatsappLink('5581987654321', 'Olá! Tudo bem?')).toBe('https://wa.me/5581987654321?text=Ol%C3%A1!%20Tudo%20bem%3F');
    expect(publicContact({ whatsapp: '5581987654321', brand_name: 'Estúdio X' }).whatsappUrl).toContain('Est%C3%BAdio%20X');
  });
});

describe('e-mail e Instagram', () => {
  it('e-mail de exemplo ou inválido some', () => {
    expect(cleanEmail('oi@example.com')).toBeNull();
    expect(cleanEmail('sem-arroba')).toBeNull();
    expect(cleanEmail('ana@estudio.com.br')).toBe('ana@estudio.com.br');
  });
  it('Instagram aceita @, nome ou link', () => {
    expect(cleanInstagram('@ana.tattoo')).toBe('ana.tattoo');
    expect(cleanInstagram('https://www.instagram.com/ana.tattoo/')).toBe('ana.tattoo');
    expect(cleanInstagram('[perfil]')).toBeNull();
  });
});

describe('outras redes', () => {
  it('TikTok, YouTube e Facebook a partir de @perfil', () => {
    expect(socialUrl('tiktok', '@ana.tattoo')).toBe('https://www.tiktok.com/@ana.tattoo');
    expect(socialUrl('youtube', 'anatattoo')).toBe('https://www.youtube.com/@anatattoo');
    expect(socialUrl('facebook', 'ana.tattoo.studio')).toBe('https://www.facebook.com/ana.tattoo.studio');
  });
  it('aceita link da própria rede e força https', () => {
    expect(socialUrl('youtube', 'http://youtube.com/@ana')).toBe('https://youtube.com/@ana');
    expect(socialUrl('tiktok', 'www.tiktok.com/@ana.tattoo')).toBe('https://www.tiktok.com/@ana.tattoo');
  });
  it('recusa link de outro site ou sem perfil', () => {
    expect(socialUrl('facebook', 'https://golpe.com/ana')).toBeNull();
    expect(socialUrl('tiktok', 'https://www.tiktok.com/')).toBeNull();
    expect(socialUrl('youtube', '')).toBeNull();
  });
});
