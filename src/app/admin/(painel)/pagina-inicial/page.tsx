import Link from 'next/link';
import { ImageInput } from '@/components/ImageInput';
import { requireAdmin } from '@/lib/admin';
import { serviceClient } from '@/lib/supabase/admin';
import { getArtist, getSettings, publicImageUrl } from '@/lib/data';
import { ActionForm, Submit } from '@/components/ActionForm';
import { SlotPicker } from '@/components/SlotPicker';
import { saveAboutContent, saveHeroContent, saveHomeImage, saveHomeLists, saveTestimonialsDisplay } from '@/app/admin/home-actions';
import { HeroEditor } from '@/components/admin/HeroEditor';
import { heroDisplay } from '@/lib/hero';

type Slot = 'hero' | 'about' | 'sim';
const RATIO: Record<Slot, string> = { hero: '4 / 5', about: '3 / 4', sim: '16 / 10' };
const ALT_EXAMPLE: Record<Slot, string> = { hero: 'ex.: rosa em fine line no antebraço', about: 'ex.: artista desenhando no estúdio', sim: 'ex.: prévia de um desenho aplicado no braço' };

function ImageSlot({ slot, title, hint, path, alt, caption }: { slot: Slot; title: string; hint: string; path: string | null; alt: string | null; caption?: string | null }) {
  const url = publicImageUrl(path);
  return (
    <section className="panel" aria-labelledby={`t-${slot}`}>
      <h2 id={`t-${slot}`}>{title}</h2>
      <div className="panel-body" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 20 }}>
        <div style={{ width: slot === 'sim' ? 240 : 160, aspectRatio: RATIO[slot], border: `1px ${url ? 'solid' : 'dashed'} var(--line-strong)`, background: url ? `center / cover no-repeat url(${url})` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: url ? 0 : 12, flex: 'none' }}>
          {url ? null : <span className="small">Vazio — o site mostra um espaço reservado</span>}
        </div>
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <p className="small" style={{ margin: 0 }}>{hint}</p>
          <ActionForm action={saveHomeImage}>
            <input type="hidden" name="slot" value={slot} />
            <ImageInput name="image" label={<>{url ? 'Trocar imagem' : 'Enviar imagem'} <small>— JPG, PNG, WebP ou AVIF</small></>} />
            <label className="field"><span>Descrição da imagem <small>— para leitores de tela</small></span><input className="input" name="alt" defaultValue={alt ?? ''} placeholder={ALT_EXAMPLE[slot]} /></label>
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
  const [s, artist] = await Promise.all([getSettings(), getArtist()]);
  const db = serviceClient();
  const [{ data: works }, { data: flash }, { count: publishedTestimonials }] = await Promise.all([
    db.from('portfolio_items').select('id, title, status, images:portfolio_images(storage_path, sort)').eq('artist_id', ctx.artistId).eq('status', 'publicado').order('sort'),
    db.from('flash_projects').select('id, name, status, image_path').eq('artist_id', ctx.artistId).in('status', ['disponivel', 'reservado']).not('image_path', 'is', null).order('sort'),
    db.from('testimonials').select('id', { count: 'exact', head: true }).eq('artist_id', ctx.artistId).eq('published', true)
  ]);
  type W = { id: string; title: string; images: { storage_path: string; sort: number }[] };
  const workOpts = ((works ?? []) as W[]).filter((w) => w.images.length).map((w) => ({ id: w.id, label: w.title, thumb: publicImageUrl(w.images.sort((a, b) => a.sort - b.sort)[0].storage_path)! }));
  const flashOpts = ((flash ?? []) as { id: string; name: string; status: string; image_path: string }[]).map((f) => ({ id: f.id, label: f.name + (f.status === 'reservado' ? ' (reservado)' : ''), thumb: publicImageUrl(f.image_path)! }));
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'end', gap: 12 }}>
        <div><h1 className="h2">Página inicial</h1><p className="muted" style={{ margin: 0 }}>Escolha o que aparece em cada espaço da tela principal. Topo, trabalhos, simulador e sobre sempre aparecem (sem imagem, com um espaço reservado discreto); os demais só quando têm conteúdo.</p></div>
        <Link className="btn btn-ghost btn-sm" href="/" target="_blank">Ver o site</Link>
      </div>

      <section className="panel" aria-labelledby="t-hero">
        <h2 id="t-hero">1 · Topo da página — textos e enquadramento</h2>
        <div className="panel-body">
          <HeroEditor
            action={saveHeroContent}
            brand={s.brand_name}
            imageUrl={publicImageUrl(s.hero_image_path)}
            initial={(() => {
              const d = heroDisplay(s);
              return { eyebrow: s.hero_eyebrow ?? '', title: s.hero_title, subtitle: s.hero_subtitle, layout: d.layout, overlay: Math.round(d.overlay * 100), focusX: d.focusX, focusY: d.focusY, zoom: Math.round(d.zoom * 100) };
            })()}
          />
        </div>
      </section>

      <ImageSlot slot="hero" title="1 · Topo da página — foto" hint="Foto principal do artista ou de uma tatuagem. Prefira foto vertical (4:5) com pelo menos 1600 px de altura; o enquadramento é ajustado no quadro acima. A legenda aparece no canto da foto." path={s.hero_image_path} alt={s.hero_image_alt} caption={s.hero_caption} />

      <section className="panel" aria-labelledby="t-works">
        <h2 id="t-works">2 · Trabalhos selecionados</h2>
        <div className="panel-body">
          <p className="small" style={{ margin: 0 }}>Até 4 tatuagens no mosaico da página inicial, na ordem escolhida. Sem escolha, aparecem automaticamente as marcadas como destaque e as mais recentes do portfólio.</p>
          {workOpts.length ? (
            <ActionForm action={saveHomeLists}>
              <input type="hidden" name="kind" value="works" />
              <SlotPicker options={workOpts} initial={s.home_works} />
              <Submit>Salvar ordem</Submit>
            </ActionForm>
          ) : <p className="muted" style={{ margin: 0 }}>Você ainda não tem tatuagens publicadas com foto. <Link href="/admin/portfolio/novo">Cadastrar tatuagem</Link></p>}
        </div>
      </section>

      <ImageSlot slot="sim" title="3 · Simulador — imagem demonstrativa" hint="Aparece ao lado do convite “Sua tatuagem”, que leva ao simulador. Use uma imagem sua: um desenho aplicado no simulador, uma tatuagem em andamento ou o estúdio. Formato horizontal (16:10)." path={s.sim_image_path ?? null} alt={s.sim_image_alt ?? null} />

      <section className="panel" aria-labelledby="t-about">
        <h2 id="t-about">4 · Sobre o artista — textos</h2>
        <div className="panel-body">
          <p className="small" style={{ margin: 0 }}>Nome do artista: <strong>{artist.name}</strong> — muda em <Link href="/admin/configuracoes">Configurações</Link>. As especialidades também ficam lá.</p>
          <ActionForm action={saveAboutContent}>
            <label className="field">
              <span>Frase de apresentação <small>— opcional, aparece abaixo do nome (até 160 caracteres)</small></span>
              <input className="input" name="about_headline" defaultValue={s.about_headline ?? ''} maxLength={160} placeholder="Uma frase sobre o seu trabalho, com as suas palavras" />
            </label>
            <label className="field">
              <span>Sobre mim <small>— linha em branco separa parágrafos; a página inicial mostra o primeiro e o texto completo fica em /sobre</small></span>
              <textarea className="textarea" name="about" rows={8} defaultValue={s.about} maxLength={3000} placeholder="Trajetória, há quanto tempo tatua, estilos, onde atende…" />
            </label>
            <Submit>Salvar sobre o artista</Submit>
          </ActionForm>
        </div>
      </section>

      <ImageSlot slot="about" title="4 · Sobre o artista — foto" hint="Seu retrato, na seção Sobre o artista e na página /sobre. Formato vertical (3:4)." path={s.about_image_path} alt={s.about_image_alt} />

      <section className="panel" aria-labelledby="t-flash">
        <h2 id="t-flash">5 · Desenhos exclusivos (projetos disponíveis)</h2>
        <div className="panel-body">
          <p className="small" style={{ margin: 0 }}>Até 4 projetos na galeria da página inicial, na ordem escolhida. Sem escolha, aparecem automaticamente os disponíveis e depois os reservados. Projetos já tatuados não aparecem aqui.</p>
          {flashOpts.length ? (
            <ActionForm action={saveHomeLists}>
              <input type="hidden" name="kind" value="flash" />
              <SlotPicker options={flashOpts} initial={s.home_flash} square />
              <Submit>Salvar ordem</Submit>
            </ActionForm>
          ) : <p className="muted" style={{ margin: 0 }}>Nenhum projeto com imagem disponível. <Link href="/admin/projetos/novo">Cadastrar projeto</Link></p>}
        </div>
      </section>


      <section className="panel" aria-labelledby="t-ig">
        <h2 id="t-ig">6 · Faixa do Instagram</h2>
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
        <h2 id="t-dep">7 · Depoimentos</h2>
        <div className="panel-body">
          <p className="muted" style={{ margin: 0 }}>
            {publishedTestimonials ? `${publishedTestimonials} ${publishedTestimonials === 1 ? 'depoimento publicado' : 'depoimentos publicados'} — aparecem um por vez, com setas.` : 'Nenhum depoimento publicado ainda.'}{' '}
            <Link href="/admin/depoimentos">Gerenciar depoimentos</Link>
          </p>
          <ActionForm action={saveTestimonialsDisplay}>
            <label className="check">
              <input type="checkbox" name="show_empty" defaultChecked={s.testimonials_show_empty === true} />
              <span>Mostrar a seção mesmo sem depoimentos publicados, com o aviso discreto “Os depoimentos de clientes aparecem aqui quando forem publicados.” <small className="small">Desmarcado, a seção fica escondida até o primeiro depoimento.</small></span>
            </label>
            <Submit className="btn btn-ghost btn-sm">Salvar opção</Submit>
          </ActionForm>
        </div>
      </section>
    </>
  );
}
