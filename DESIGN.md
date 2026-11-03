# DESIGN.md — Tattoin Line

Sistema visual do redesign. **Implementado na Etapa 02** (estrutura global); as páginas são
redesenhadas nas etapas 04–10 ([`docs/REDESIGN-PLANO.md`](docs/REDESIGN-PLANO.md)).

Direção: estúdio autoral, escuro e silencioso. Preto e grafite, títulos grandes em caixa alta e peso
leve, rótulos espaçados, fios finos separando blocos, cantos retos, um destaque verde-limão usado com
moderação. Quem dá cor ao site são as fotos das tatuagens, enviadas pelo tatuador no painel.
Sem gradientes coloridos, sombras decorativas, ilustrações ou ícones decorativos.

Onde está no código:

| Arquivo | Conteúdo |
|---|---|
| `src/styles/tokens.css` | Todos os tokens (cor, tipografia, espaço, forma, movimento, camadas) e o tema claro |
| `src/styles/base.css` | Reset, títulos, texto, rótulos, links, containers, grade de 12 colunas, divisórias, utilitários, revelação ao rolar |
| `src/styles/components.css` | Botões, campos, avisos, status, navbar, menu mobile, rodapé, WhatsApp, transições de página |
| `src/app/globals.css` | Estilos específicos das páginas (refeitos nas próximas etapas) |
| `tailwind.config.ts` | Mesmos tokens como utilitários (`bg-surface`, `text-fg-muted`, `border-line`…) |

Regra: páginas usam **nomes de token**, nunca valores soltos.

---

## 1. Cor

| Token | Escuro (padrão) | Claro | Papel |
|---|---|---|---|
| `--color-bg` | `#0B0B0B` | `#F4F4F2` | Fundo principal |
| `--color-bg-alt` | `#111111` | `#ECECE9` | Fundo secundário: faixas alternadas |
| `--color-surface` | `#181818` | `#FFFFFF` | Superfícies: painéis, molduras vazias, menus |
| `--color-border` | `#303030` | `#D6D6D2` | Divisórias e bordas |
| `--color-border-strong` | `#4A4A4A` | `#A8A8A3` | Borda do botão secundário, divisória de destaque |
| `--color-border-input` | `#6B6B6B` | `#8A8A86` | Borda de campo (3.7:1 / 3.1:1) |
| `--color-text` | `#F0F0F0` | `#101010` | Texto principal; fundo do botão primário |
| `--color-text-muted` | `#999999` | `#5C5C5A` | Texto secundário, rótulos (6.9:1 / 6.1:1) |
| `--color-accent` | `#C5FF4A` | `#C5FF4A` | Destaque: preenchimento no hover do primário, faixa de progresso, seleção |
| `--color-accent-text` | = accent | accent 42% + preto (`#536B1F`, 5.5:1) | Destaque em texto, borda, sublinhado e foco |
| `--color-on-accent` / `--color-on-text` | `#0B0B0B` | `#0B0B0B` / `#F4F4F2` | Texto sobre destaque / sobre botão primário |
| `--color-ok` · `--color-warn` · `--color-danger` | `#8FCF9B` · `#E8B86A` · `#FF7A6B` | `#2E6B3E` · `#7A4F10` · `#B23A2B` | Estados |

**Onde o destaque aparece (e só aí):** sublinhado do link ativo da navbar, contorno do botão "Agendar",
hover do botão primário, links de ação com seta, ponto de status "disponível", etapa atual do
agendamento, anel de foco, faixa de carregamento.

**Personalização:** a cor de destaque pode ser trocada em Painel → Configurações → Cor de destaque.
O valor antigo padrão do banco (`#a3342a`) é tratado como "não personalizado" e cai no `#C5FF4A`.

## 2. Tipografia

- **Space Grotesk** (300, 400, 500): títulos, navegação, rótulos, botões, números. Variável `--font-heading`.
- **Inter** (400, 500, 600): texto corrido e formulários. Variável `--font-text`.

| Token | Valor | Uso |
|---|---|---|
| `--fs-display` | `clamp(44px, 6.4vw, 96px)`, 300, caixa alta, lh 0.98 | `.display` — título de abertura |
| `--fs-h1` | `clamp(40px, 5.2vw, 76px)`, 300, caixa alta | `.h1` e `.page-head h1` |
| `--fs-h2` | `clamp(32px, 3.6vw, 52px)`, 300, caixa alta | `.h2` — título de seção |
| `--fs-h3` | `clamp(20px, 1.7vw, 24px)`, 400 | `.h3` |
| `--fs-lead` | `clamp(17px, 1.3vw, 19px)`, cor secundária, máx. 52ch | `.lead` |
| `--fs-body` | `16px`, lh 1.65 | texto |
| `--fs-small` | `14px` | `.small` |
| `--fs-label` | `12px`, 500, caixa alta, `letter-spacing: .18em` | `.eyebrow` (com fio depois: "PORTFÓLIO ——"), `.label`, `.index` ("01 / 04") |

## 3. Espaço, grade e containers

- Escala base 4: `--space-1` (4) … `--space-12` (128): 4 8 12 16 24 32 40 48 64 80 96 128.
- `--section-y: clamp(72px, 9vw, 128px)` — respiro vertical de `.section`.
- `--gutter: clamp(16px, 4vw, 40px)` — margem lateral.
- `.container` (= `.wrap`): 1320px de conteúdo. `.container-narrow` 760px, `.container-wide` 1600px, `.container-full` sem limite.
- `.grid-12`: 12 colunas, gutter 24px; abaixo de 900px vira 4 colunas com itens em largura total.
- `--header-h: 72px`.

## 4. Forma e divisórias

- `--radius: 0` em tudo. Exceção funcional: obturador da câmera do simulador.
- Sem sombras. Profundidade por fio e troca de superfície.
- `.divider` (fio horizontal), `.divider-strong`, `.divider-v` (vertical), `.split` (faixa em colunas separadas por fios; empilha no celular), `.section + .section` ganha fio no topo automaticamente (`.no-rule` desliga).

## 5. Movimento

`--ease: cubic-bezier(.2,.7,.1,1)`; `--dur-fast` 150ms (cor), `--dur` 250ms (UI), `--dur-slow` 600ms (entrada).
- Link: sublinhado de 1px cresce da esquerda (`.link`); seta anda 4px (`.link-arrow`, botões).
- Navbar: fio inferior aparece ao rolar; marca gira 45° no hover.
- Revelação ao rolar: opacidade + 20px (`data-rv`).
- Transição de página: fade + 8px. Menu mobile: links entram em cascata (35ms).
- `prefers-reduced-motion`: animações e transições viram instantâneas.

## 6. Componentes

| Componente | Classe / arquivo | Especificação |
|---|---|---|
| Botão primário | `.btn.btn-primary` (`.btn-accent`, `.btn-ink` são sinônimos antigos) | Fundo `--color-text`, texto escuro, 48px, cantos retos. Hover: vira destaque. 1 por tela |
| Botão secundário | `.btn.btn-secondary` (`.btn-ghost`) | Contorno `--color-border-strong`; hover contorno claro |
| Botão destaque | `.btn.btn-accent-outline` | Contorno no destaque; hover preenche. Só o "Agendar" da navbar |
| Botão silencioso | `.btn.btn-quiet`, `.btn-link` | Só texto |
| Tamanhos | `.btn-sm` (40px), `.btn-block` | |
| Botão de ícone | `.icon-btn`, `.theme-btn` | 44×44, quadrado |
| Links | `.link`, `.link-muted`, `.link-arrow` (+ `.is-neutral`) | |
| Campos | `.field`, `.input`, `.select`, `.textarea`, `.check`, `.err`, `.form-grid` | Transparente, borda `--color-border-input`, 48px; foco borda clara + anel |
| Avisos | `.alert`, `.alert-bad`, `.alert-ok`, `.notice` | Superfície + fio colorido à esquerda |
| Status | `.badge-*`, `.tag-*`, `.status` | Ponto 6px colorido + rótulo em caixa alta |
| Navbar | `SiteHeader.tsx` | Marca + nome à esquerda; Início · Tatuagens · Projetos · Simulador · Estilos · Preços · Sobre ao centro; tema + "Agendar ↗" à direita |
| Menu mobile | `SiteHeader.tsx` (≤ 1100px) | Tela cheia, links grandes numerados, Agendar e contatos embaixo; Esc fecha, foco volta ao botão, rolagem travada, conteúdo de trás `inert` |
| Rodapé | `SiteFooter.tsx` | Três áreas — Identidade, Redes sociais, Informações — e linha com © (ano automático). Ver §16 |
| Marca | `BrandMark` em `Icons.tsx` | Estrela de 4 pontas em traço fino — trocar pelo logotipo do tatuador quando houver |
| WhatsApp | `.wa-float` | Quadrado com contorno; só ícone no celular |
| Links da navegação | `src/components/nav.ts` | Lista única usada pela navbar, menu e rodapé |
| Espaço para imagem | `MediaPlaceholder.tsx` (`.media-ph`) | Fundo de superfície, fio, marcas de canto, mira central e rótulo discreto ("IMAGEM PRINCIPAL · 4:5") |
| Escopo escuro | `.theme-dark` (tokens.css) | Mantém texto claro sobre fotografia, mesmo no tema claro |

Ícones: `lucide-react`, traço 1.5, só com função (menu, fechar, tema, setas, redes).

## 7. Imagens

**Nenhuma imagem é gerada, procurada ou escolhida por nós.** Todas vêm do painel (`/admin`).
Sem imagem, a moldura mantém a proporção e mostra um espaço neutro (`--color-surface` + fio).

| Slot | Origem no painel / banco | Proporção |
|---|---|---|
| Capa da home | Página inicial → `site_settings.hero_image_path` | 4:5 |
| Retrato "Sobre" | Página inicial → `site_settings.about_image_path` | 3:4 |
| Fotos dos trabalhos (grades, destaque, estilos, relacionados) | Portfólio → `portfolio_images` | 4:5 |
| Desenho flash | Projetos → `flash_projects.image_path` | 1:1, `contain` |
| Arte do simulador | Projetos → `simulation_image_path` (PNG transparente) | livre |
| Faixa Instagram | `home_instagram` (capas do portfólio) | 1:1 |

Toda foto de trabalho usa 4:5 para o tatuador enviar uma foto só; a assimetria vem do tamanho e da
posição das molduras, não de recortes diferentes. Nenhum slot novo exige mudança de banco.

## 8. Primeira dobra (hero)

`src/components/home/Hero.tsx` + `src/styles/home.css` · editado em **Painel → Página inicial → 1 · Topo da página**.

- Altura da tela menos a navbar (mín. 600px, máx. 1040px). Título à esquerda (até 3 linhas; Enter no painel quebra a linha), frase, "Ver portfólio" (primário) e "Agendar sessão" (secundário).
- Detalhes: fio vertical à esquerda do texto, índice "01 / NN" (NN = seções que a home mostra), arco fino cruzando texto e foto, legenda da foto no canto superior direito.
- Foto: `lateral` (60% da largura, sangrando à direita, com fusão no fundo) ou `fundo` (tela inteira com escurecimento à esquerda para leitura). Escurecimento 0–85%, ponto de foco X/Y e aproximação 100–200%, com prévia ao vivo no painel (clique na foto define o foco).
- Celular: com foto, ela vira fundo e o texto fica embaixo; sem foto, o espaço reservado aparece abaixo do texto.
- Com foto, o hero usa `.theme-dark` (fica escuro também no tema claro).
- Entrada: linhas do título sobem de uma máscara, foto revela da direita; com movimento reduzido tudo aparece direto.
- Banco: colunas `hero_eyebrow`, `hero_layout`, `hero_overlay`, `hero_focus_x`, `hero_focus_y`, `hero_zoom` (migration `0007_hero.sql`). Antes da migration, o site usa os padrões e o painel avisa.

## 9. Faixa de diferenciais

`src/components/home/FeatureStrip.tsx` — logo abaixo do topo. Quatro itens (Desenhos autorais · Atendimento
personalizado · Localização confirmada · Agendamento online), ícone `lucide` de traço 1.25 + rótulo em caixa
alta 11px, fios verticais que não encostam nas bordas. No celular vira 2×2 com fios em cruz. Os textos ficam
na lista `ITEMS` do componente. Substitui o letreiro rolante antigo.

## 10. Trabalhos selecionados (mosaico)

`src/components/home/PortfolioSection.tsx` + `src/lib/home.ts` · seção numerada "02 / NN".

- Texto em 4 colunas (índice, rótulo, título, frase, "Ver todos os trabalhos →") e mosaico nas 8 restantes.
- **De onde vêm as fotos:** os trabalhos escolhidos em Painel → Página inicial (até 4, na ordem escolhida);
  sem escolha, os marcados como *destaque* e depois os mais recentes. Só trabalhos publicados com foto.
- **Mosaico:** grade de 4 colunas com linha ≈ 0,62 da coluna, então os encaixes dão proporções diferentes sem
  recortes deitados: grande 2×4 (4:5), alto 1×3 (~1:2), pequeno 1×2 (4:5), quase quadrado 2×3. Um desenho por
  quantidade (1, 2, 3 ou 4), sempre sem buracos; o bloco de texto "N trabalhos publicados · Ver portfólio" fecha a grade.
- **Hover:** foto aproxima 3,5% devagar, escurecimento de baixo e legenda (número, estilo, título). Teclado: mesmo efeito no foco.
- **Sem trabalhos publicados:** 4 espaços reservados ("Trabalho 01"…) e o aviso "Portfólio em montagem" — nunca imagem de exemplo.
- Celular: 2 colunas, o primeiro trabalho ocupa a largura toda.

## 11. Faixa do simulador

`src/components/home/SimulatorSection.tsx` · seção "03 / NN".

- Duas partes: imagem demonstrativa à esquerda (7/12, encostada na borda da tela) e texto à direita
  ("EXPERIMENTE" · "SUA TATUAGEM" · explicação · "Testar agora →" para `/simulador`). Em telas ≥ 1280px, fio
  vertical e estrela da marca em traço fino à direita, como na referência.
- Imagem: Painel → Página inicial → 3 · Simulador (`site_settings.sim_image_path`, migration 0008). Sem imagem,
  espaço reservado "Imagem demonstrativa · 16:10". No celular a imagem fica em cima, em 16:10.
- O simulador (`/simulador`) não mudou. As alças do editor usam a cor de destaque (`--color-accent`).

## 12. Sobre o artista

`src/components/home/AboutSection.tsx` (página inicial, "04 / NN") e `src/app/(site)/sobre/page.tsx` (página completa).

- Primeira coluna: nome (Configurações), frase de apresentação (`about_headline`, opcional), resumo do "Sobre mim"
  (primeiro parágrafo, cortado em palavra inteira), especialidades separadas por "/" e "Conhecer mais →" para `/sobre`.
- Segunda coluna: foto 3:4 (Painel → Página inicial → 4 · Sobre o artista — foto) com legenda "Nome — Cidade".
- Estados vazios: sem texto, aviso discreto "Apresentação do artista ainda não cadastrada." (e sem botão);
  sem foto, espaço reservado "Foto do artista · 3:4". Texto-modelo entre colchetes conta como vazio.
- A navbar "Sobre" leva a `/sobre`. Frase e "Sobre mim" são editados em Página inicial (saíram de Configurações).

## 13. Desenhos exclusivos (projetos disponíveis)

`src/components/home/ProjectsSection.tsx` + `src/components/ProjectCard.tsx` · seção "05 / NN" em `--color-bg-alt`.

- Cabeçalho: "Projetos disponíveis" · "DESENHOS EXCLUSIVOS" · "Arte única, pronta para ser tatuada." · "Ver todos os projetos →".
- Galeria de até 4 projetos: escolha em Painel → Página inicial → 5; sem escolha, disponíveis e depois reservados
  (`selectHomeFlash`). Já tatuados não entram na página inicial.
- Cartão: desenho inteiro (`contain`) sobre a superfície, status (ponto + rótulo), nome e preço, estilo · dimensões,
  "Ver detalhes →". O mesmo cartão é usado em `/projetos` (já tatuado aparece esmaecido).
- Celular: galeria com rolagem lateral e encaixe (cartões de 78%). Sem projetos: aviso discreto e "Pedir um desenho personalizado".
- Detalhes em `/projetos/[slug]`: desenho grande, ficha (estilo, dimensões, região, duração, valor, sinal), "Reservar este
  projeto" (fluxo de agendamento existente) e "Ver no meu corpo" (só se liberado no simulador); reservado/já tatuado mostram aviso.

## 14. Depoimentos

`src/components/home/TestimonialsSection.tsx` + `TestimonialsCarousel.tsx` · seção "06 / NN".

- "Depoimentos" · "O QUE NOSSOS CLIENTES DIZEM" à esquerda; um depoimento por vez à direita: citação grande, nome
  autorizado na cor de destaque, origem e nota (só se cadastradas), setas, contador e barra de progresso. Desliza no celular. Não troca sozinho.
- Só depoimentos publicados com autorização do cliente (Painel → Depoimentos). Nada inventado.
- Sem nenhum publicado: a seção some (padrão) ou mostra o aviso "Os depoimentos de clientes aparecem aqui quando forem
  publicados.", conforme Painel → Página inicial → 7 (`testimonials_show_empty`, migration 0009).

## 15. Contato ("Vamos conversar?")

`src/components/home/ContactSection.tsx` · última seção numerada da página inicial.

- Título grande "VAMOS CONVERSAR?" à esquerda; convite curto, "Agendar sessão →" (primário) e "Falar no WhatsApp"
  (contorno no destaque) à direita; linha "Cidade · Somente com hora marcada". Arco fino retomando o do topo.
- O WhatsApp vem de Configurações (número + mensagem pronta). Sem número real, o botão some.

## 16. Rodapé

`src/components/SiteFooter.tsx` · dados sempre de `publicContact()` (`src/lib/contact.ts`).

- **Identidade:** marca (estrela) + nome do estúdio, breve descrição (Configurações → Descrição para o Google; sem ela,
  "Tatuagem autoral por {artista}, em {cidade}."), endereço e e-mail quando cadastrados.
- **Redes sociais:** Instagram, WhatsApp, TikTok, YouTube e Facebook — cada um só se cadastrado; sem nenhum, a área some.
  TikTok/YouTube/Facebook: Configurações → Contato (@perfil ou link; migration 0010).
- **Informações:** Política de privacidade, Termos de uso, Cancelamento (`/politicas`) e Informações legais (só com dados
  comerciais reais; texto abaixo dos links e seção `#legal` nas políticas).
- Linha final: "© {ano atual} {estúdio}. Todos os direitos reservados." · Cadastro de cliente · Área do artista.
- **Nada de demonstração:** `publicContact()` descarta texto entre colchetes, números com sequência de zeros, e-mails
  de exemplo/example e o @ do banco de demonstração. Vale para rodapé, contato, WhatsApp flutuante, menu do celular,
  políticas, página da reserva e dados estruturados do Google.

## 17. Responsividade, movimento e acabamento (etapa 08)

- Larguras testadas: 1920, 1440, 1366, iPad Pro paisagem (1194), iPad Mini (768), iPhone 14 Pro Max (430),
  Pixel 7 (412), iPhone 14 (390), iPhone SE (375), Galaxy S9+ (320). Nenhuma rolagem lateral.
- Alvos de toque: links soltos com 44px de altura (`.tap`, rodapé, trilhas, "Ver detalhes"); caixas de marcar 24px.
- Entradas ao rolar: só verticais em telas ≤ 900px; com "reduzir movimento", tudo aparece direto (sem atraso).
- Painel no celular (≤ 760px): menu vira faixa horizontal fixa no topo; a tela atual fica à vista.
- "Pular para o conteúdo": recortado até receber foco pelo teclado.
- Dados do Supabase nunca vêm do cache do Next (`src/lib/supabase/fetch.ts`), como já acontecia com o Mercado Pago.
- Imagem de compartilhamento (`opengraph-image.tsx`) na identidade nova e gerada na hora.
