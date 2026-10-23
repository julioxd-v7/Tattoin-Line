import Link from 'next/link';
import { ImageInput } from '@/components/ImageInput';
import { requireAdmin } from '@/lib/admin';
import { serviceClient } from '@/lib/supabase/admin';
import { getSettings, publicImageUrl } from '@/lib/data';
import { ActionForm, Submit } from '@/components/ActionForm';
import { SlotPicker } from '@/components/SlotPicker';
import { saveHomeImage, saveHomeLists } from '@/app/admin/home-actions';

function ImageSlot({ slot, title, hint, path, alt, caption }: { slot: 'hero' | 'about'; title: string; hint: string; path: string | null; alt: string | null; caption?: string | null }) {
  const url = publicImageUrl(path);
  return (
    <section className="panel" aria-labelledby={`t-${slot}`}>
      <h2 id={`t-${slot}`}>{title}</h2>
      <div className="panel-body" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 20 }}>
        <div style={{ width: 160, aspectRatio: slot === 'hero' ? '4 / 5' : '3 / 4', borderRadius: slot === 'about' ? '80px 80px 8px 8px' : 8, border: `1px ${url ? 'solid' : 'dashed'} var(--line-strong)`, background: url ? `center / cover no-repeat url(${url})` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          {url ? null : <span className="small">Vazio — não aparece no site</span>}
        </div>
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <p className="small" style={{ margin: 0 }}>{hint}</p>
          <ActionForm action={saveHomeImage}>
            <input type="hidden" name="slot" value={slot} />
            <ImageInput name="image" label={<>{url ? 'Trocar imagem' : 'Enviar imagem'} <small>— JPG, PNG, WebP ou AVIF</small></>} />
            <label className="field"><span>Descrição da imagem <small>— para leitores de tela</small></span><input className="input" name="alt" defaultValue={alt ?? ''} placeholder={slot === 'hero' ? 'ex.: rosa em fine line no antebraço' : 'ex.: artista desenhando no estúdio'} /></label>
            {slot === 'hero' ? <label className="field"><span>Legenda <small>— opcional</small></span><input className="input" name="caption" defaultValue={caption ?? ''} maxLength={120} placeholder="ex.: Rosa · 2026" /></label> : null}
            <Submit>Salvar</Submit>
          </ActionForm>
          {url ? (
            <ActionForm action={saveHomeImage}>
              <input type="hidden" name="slot" value={slot} /><input type="hidden" name="remove" value="1" />
              <Submit className="btn btn-ghost btn-sm">Remover imagem</Submit>
            </ActionForm>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default async function PaginaInicial() {
  const ctx = await requireAdmin();
  const s = await getSettings();
  const db = serviceClient();
  const [{ data: works }, { data: flash }] = await Promise.all([
    db.from('portfolio_items').select('id, title, status, images:portfolio_images(storage_path, sort)').eq('artist_id', ctx.artistId).eq('status', 'publicado').order('sort'),
    db.from('flash_projects').select('id, name, status, image_path').eq('artist_id', ctx.artistId).in('status', ['disponivel', 'reservado']).not('image_path', 'is', null).order('sort')
  ]);
  type W = { id: string; title: string; images: { storage_path: string; sort: number }[] };
  const workOpts = ((works ?? []) as W[]).filter((w) => w.images.length).map((w) => ({ id: w.id, label: w.title, thumb: publicImageUrl(w.images.sort((a, b) => a.sort - b.sort)[0].storage_path)! }));
  const flashOpts = ((flash ?? []) as { id: string; name: string; status: string; image_path: string }[]).map((f) => ({ id: f.id, label: f.name + (f.status === 'reservado' ? ' (reservado)' : ''), thumb: publicImageUrl(f.image_path)! }));
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'end', gap: 12 }}>
        <div><h1 className="h2">Página inicial</h1><p className="muted" style={{ margin: 0 }}>Escolha o que aparece em cada espaço da tela principal. Espaço vazio não aparece para o visitante.</p></div>
        <Link className="btn btn-ghost btn-sm" href="/" target="_blank">Ver o site</Link>
      </div>

      <ImageSlot slot="hero" title="1 · Destaque do topo" hint="Aparece ao lado da caveira, no início da página, como uma foto de polaroid." path={s.hero_image_path} alt={s.hero_image_alt} caption={s.hero_caption} />

      <section className="panel" aria-labelledby="t-works">
        <h2 id="t-works">2 · Trabalhos selecionados</h2>
        <div className="panel-body">
          {workOpts.length ? (
            <ActionForm action={saveHomeLists}>
              <input type="hidden" name="kind" value="works" />
              <SlotPicker options={workOpts} initial={s.home_works} />
              <Submit>Salvar ordem</Submit>
            </ActionForm>
          ) : <p className="muted" style={{ margin: 0 }}>Você ainda não tem tatuagens publicadas com foto. <Link href="/admin/portfolio/novo">Cadastrar tatuagem</Link></p>}
        </div>
      </section>

      <section className="panel" aria-labelledby="t-flash">
        <h2 id="t-flash">3 · Projetos disponíveis</h2>
        <div className="panel-body">
          {flashOpts.length ? (
            <ActionForm action={saveHomeLists}>
              <input type="hidden" name="kind" value="flash" />
              <SlotPicker options={flashOpts} initial={s.home_flash} square />
              <Submit>Salvar ordem</Submit>
            </ActionForm>
          ) : <p className="muted" style={{ margin: 0 }}>Nenhum projeto com imagem disponível. <Link href="/admin/projetos/novo">Cadastrar projeto</Link></p>}
        </div>
      </section>

      <ImageSlot slot="about" title="4 · Foto do Sobre mim" hint="Seu retrato ou do estúdio, na seção Sobre mim. Sem foto, o texto ocupa a largura toda." path={s.about_image_path} alt={s.about_image_alt} />

      <section className="panel" aria-labelledby="t-ig">
        <h2 id="t-ig">5 · Faixa do Instagram</h2>
        <div className="panel-body">
          {!s.instagram ? (
            <p className="muted" style={{ margin: 0 }}>Informe seu Instagram em <Link href="/admin/configuracoes">Configurações</Link> para a faixa aparecer.</p>
          ) : workOpts.length ? (
            <ActionForm action={saveHomeLists}>
              <p className="small" style={{ margin: 0 }}>Até 6 fotos do portfólio que levam para o seu perfil @{s.instagram.replace('@', '')}. Sem fotos, aparece só o convite para seguir.</p>
              <input type="hidden" name="kind" value="instagram" />
              <SlotPicker options={workOpts} initial={s.home_instagram ?? []} square count={6} />
              <Submit>Salvar fotos</Submit>
            </ActionForm>
          ) : <p className="muted" style={{ margin: 0 }}>Publique tatuagens com foto no portfólio para escolher aqui.</p>}
        </div>
      </section>

      <section className="panel" aria-labelledby="t-dep">
        <h2 id="t-dep">6 · Depoimentos</h2>
        <div className="panel-body"><p className="muted" style={{ margin: 0 }}>Aparecem antes da chamada final quando houver pelo menos um publicado. <Link href="/admin/depoimentos">Gerenciar depoimentos</Link></p></div>
      </section>
    </>
  );
}
