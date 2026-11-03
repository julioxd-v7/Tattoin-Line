# Redesign Tattoin Line — Etapa 01: análise e plano

Escopo: reformular **só a camada visual** (layout, CSS, marcação dos componentes de apresentação).
Ficam intactos: rotas, `src/lib/*`, `src/app/api/*`, server actions, middleware, Supabase (schema,
RLS, buckets, migrations), Mercado Pago, crons, notificações, testes. Sistema visual em [`DESIGN.md`](../DESIGN.md).

---

## 1. Estrutura atual

**Stack:** Next.js 14 (App Router) · React 18 · TypeScript · Tailwind 3 (quase não usado: ~33 classes
utilitárias no projeto) · CSS próprio em `src/app/globals.css` (474 linhas, ~120 classes) · Supabase ·
Mercado Pago Checkout Pro · Konva (simulador) · Resend · Vercel (crons em `vercel.json`).

O visual inteiro está em **um arquivo** (`globals.css`) com classes semânticas (`.btn`, `.field`,
`.work`, `.flash`, `.sim-*`, `.panel`…). As páginas usam essas classes e alguns `style={{}}` inline.
Isso é bom para o redesign: dá para trocar o visual reescrevendo o CSS e a marcação de apresentação,
sem tocar na lógica.

Tema atual: escuro quente (`#121110`, bege `#ede8e0`, vermelho `#a3342a`), Instrument Serif + Inter
Tight, caveiras e desenhos SVG decorativos, parallax, marquee, cantos de 8–14px e pílulas de 999px
(11 ocorrências), 2 gradientes.

`site-estatico/` é uma cópia HTML do visual antigo para divulgação. Não faz parte do app.

## 2. Páginas, componentes e funcionalidades

### Site público — `src/app/(site)/`
| Rota | Arquivo | Conteúdo / função | Dados |
|---|---|---|---|
| `/` | `page.tsx` (170 l.) | Hero, marquee, trabalhos em destaque, flash em destaque, sobre, depoimentos, Instagram, CTA, JSON-LD | settings, works, flash, testimonials |
| `/tatuagens` | `tatuagens/page.tsx` + `PortfolioBrowser` | Grade com filtro por estilo e busca | works, styles |
| `/tatuagens/[slug]` | + `Gallery`, `ShareButton` | Galeria, ficha (estilo/região/ano), relacionados | work |
| `/projetos` | + `FlashCard` | Catálogo de flash com status | flash |
| `/estilos` | + `WorkCard` | Um bloco por estilo com 4 trabalhos | styles, works |
| `/precos` | — | Faixas, tabela por tamanho, sinal, pagamento | settings |
| `/agendar` | `BookingForm` (374 l.), `SlotPicker` | Wizard: serviço → detalhes → data/horário → revisão → pagamento MP | settings, flash, `/api/disponibilidade`, `/api/agendamentos`, `/api/referencias` |
| `/simulador` | `Simulator` (304 l.), `SimEditor` (Konva), `CameraCapture` | Foto/câmera + desenho, arrastar/girar/escalar, desfazer, baixar | flash com `simulation_image_path` |
| `/reserva/[token]` | `ClientRequest` | Área do cliente: reagendar/cancelar | `/api/reserva/[token]` |
| `/pagamento/retorno` | — | Retorno do Mercado Pago (consulta o provedor) | payments |
| `/cadastro` | `SignupForm` | Cadastro rápido | `/api/clientes` |
| `/ficha/[token]` | `FichaForm` | Ficha completa com consentimento LGPD | `/api/ficha/[token]` |
| `/politicas` | — | Privacidade, cancelamento, termos | settings |
| 404 | `not-found.tsx` | — | — |

**Moldura comum** (`(site)/layout.tsx`): link "pular para o conteúdo", `PageProgress`, `SiteHeader`
(8 links + Agendar + `ThemeToggle`), rodapé de 4 colunas, WhatsApp flutuante, `Motion` (revelação ao
rolar + parallax). `template.tsx` faz a animação entre páginas. `opengraph-image.tsx`, `robots.ts` e
`sitemap.ts` geram SEO.

### Painel — `src/app/admin/`
Login, recuperação de senha, e 13 telas: resumo, agenda (+ detalhe), clientes (+ detalhe), pagamentos,
financeiro, portfólio (+ edição), projetos (+ edição), estilos, depoimentos, página inicial,
disponibilidade, configurações. Usa as mesmas classes globais (`.admin-shell`, `.panel`, `.btn`,
`.field`, `.tag`) e o mesmo `ThemeToggle`. Upload de imagens por `ImageInput` (reduz e remove EXIF/GPS).

### Regras de negócio que a interface precisa continuar exibindo
Sinal (% + mínimo) e pagamento integral opcional, reserva temporária (`hold_minutes`), consulta paga,
faixas de tamanho com "orçamento" para peças grandes, status do flash (disponível/reservado/vendido),
status de agendamento e de pagamento separados, aviso de Mercado Pago em teste, aviso de pagamento
indisponível, política de cancelamento aceita antes de pagar.

## 3. O que reaproveitar

| Item | Decisão |
|---|---|
| `src/lib/**`, `src/app/api/**`, actions, middleware, migrations, testes | **Intocados** |
| `BookingForm`, `SlotPicker`, `Simulator`, `SimEditor`, `CameraCapture`, `SignupForm`, `FichaForm`, `ClientRequest`, `ActionForm`, `ImageInput` | **Lógica intacta**. Só muda marcação de apresentação onde preciso; as classes que eles usam (`btn`, `field`, `input`, `step-panel`, `steps`, `slot`, `summary`, `sim-*`, `alert`, `err`…) viram o "contrato" que o novo CSS precisa estilizar |
| `PortfolioBrowser`, `Gallery`, `ShareButton` | Lógica intacta (filtro, busca, teclado, compartilhar); marcação da grade e dos filtros redesenhada |
| `ThemeToggle`, script de tema no `layout.tsx` | Mantidos como estão |
| `PageProgress`, `template.tsx` | Mantidos; só ajuste de estilo |
| `Motion` | Mantém a revelação ao rolar (já respeita reduced-motion e conteúdo dinâmico); **remove o parallax** |
| `SiteHeader` | Mantém estado do menu e `aria-current`; nova marcação e nova lista de links |
| `Cards.tsx` (`WorkCard`, `FlashCard`) | Mesmas props e mesmos links; nova marcação |
| `StatusTag` | Mantido; novo estilo das `.tag` |
| `Icons.tsx` / `lib/art.ts` | `SkullIcon` pode ficar no painel/favicon; `HeroSkull`, `BigSkull` e `LineArt` saem do site público. `art.ts` fica (é usado pelo `artFor` e pelo seed), só não aparece mais na interface |
| `next/font` | Mantido o mecanismo; trocam as famílias |
| `tailwind.config.ts` | Cores e fontes passam a apontar para as variáveis CSS novas |

**Componentes novos** (só apresentação): `MediaFrame` (moldura com proporção e espaço vazio),
`SectionHead` (fio + índice + título + link), `PageHead` (cabeçalho de página), `MetaLine`
(linha mono de metadados).

## 4. Nova estrutura visual

Princípios: a tipografia grande e as fotos fazem o trabalho; fios finos organizam; o conteúdo se
apoia em colunas diferentes a cada seção; um botão primário por tela.

### Navegação
Barra de 64px: marca em texto (`brand_name`) · **Trabalhos · Flash · Estilos · Simulador · Preços · Sobre** · Agendar.
"Cadastro" sai do topo e vai para o rodapé e para a página de agendamento (a rota continua).
Mobile: menu de tela cheia, links grandes, Agendar fixo embaixo.

### Home (de cima para baixo)
1. **Abertura** — título display-xl em 7 colunas, alinhado na base; à direita, a capa 4:5 (5 colunas)
   sangrando até a margem. Abaixo do título: lead + linha mono `RECIFE — FINE LINE / BLACKWORK — AGENDA ABERTA` + Agendar.
2. **01 Trabalhos** — grade assimétrica: 1 trabalho grande (7 col.) + 2 empilhados (4 col., deslocados
   para baixo) + 1 recuado. Legenda mono em cada um. "Ver portfólio →".
3. **02 Flash** — faixa `--surface`; 4 desenhos 1:1 numerados com preço mono e status.
4. **03 Sobre** — retrato 3:4 (5 col.) + texto em 6 col. com recuo; especialidades como lista com barras.
5. **04 Depoimentos** — uma citação grande por vez (h2) com autor mono; navegação por setas se houver mais.
6. **05 Instagram** — 6 quadrados 1:1 em linha, sem espaço entre eles.
7. **Encerramento** — frase grande de ponta a ponta ("Tem uma ideia? Vamos desenhar junto.") + Agendar. Sem caixa colorida.
8. **Rodapé** — 4 colunas com fios; `brand_name` em display no fim.

Cada seção continua aparecendo **só quando tem conteúdo** (comportamento atual preservado).

### Demais páginas
- **Cabeçalho de página padrão:** índice mono + h1 display à esquerda (8 col.) + lead recuado à direita, fio embaixo.
- **Tatuagens:** filtros como abas mono com contagem, busca discreta à direita; grade de 3 colunas 4:5 com
  ritmo assimétrico (a cada 5 itens, um ocupa 2 colunas).
- **Trabalho:** galeria 4:5 em 7 colunas + ficha técnica fixa (sticky) em 5 colunas, em tabela com fios;
  ação "Quero algo neste estilo"; relacionados embaixo.
- **Projetos (flash):** catálogo numerado em 4 colunas; contadores no topo (`12 DISPONÍVEIS · 3 RESERVADOS · 8 TATUADOS`);
  "Como funciona" em 3 passos numerados com fios.
- **Estilos:** cada estilo é uma linha editorial: nome display (5 col.) + descrição + 4 miniaturas.
- **Preços:** tipográfica; valores grandes em display, tabela por tamanho com fios, exemplo de sinal em ficha mono.
- **Agendar:** indicador de etapas horizontal numerado com fio de progresso; formulário em 7 col.,
  resumo fixo em 4 col.; calendário em grade de fios, horários como botões retos.
- **Simulador:** layout de ferramenta (painel 4 col. + palco 8 col.); controles retos; fluxo idêntico.
- **Reserva / Pagamento / Cadastro / Ficha:** coluna única de 640px, mesmos padrões de formulário.
- **Políticas:** leitura em 68ch com índice lateral fixo.
- **404:** título display e um link de volta.

### Painel admin
Fora do redesign visual principal. Herdará os novos tokens (cores, fonte, cantos retos) para não ficar
destoante, com uma revisão para nada quebrar. Única melhoria funcional proposta: o `ImageInput` passa a
mostrar a proporção recomendada de cada slot (ex.: "Capa: 4:5, mínimo 1600 px de altura").

## 5. Mapa de imagens (resumo)

Todas as áreas já existem no banco e no painel. Nenhuma migration nova. Detalhes e proporções em `DESIGN.md §7`.

| Área | Slot | Proporção |
|---|---|---|
| Capa da home | `hero_image_path` | 4:5 |
| Retrato sobre | `about_image_path` | 3:4 |
| Trabalhos (grade, destaque, estilos, relacionados) | `portfolio_images[0]` | 4:5 |
| Galeria do trabalho | `portfolio_images[*]` | 4:5 + miniaturas 1:1 |
| Flash | `flash_projects.image_path` | 1:1 contain |
| Instagram | `home_instagram` → capas do portfólio | 1:1 |

**Espaço vazio:** `MediaFrame` sem imagem = fundo `--surface`, fio 1px, rótulo mono `IMAGEM · 4:5 — CAPA`.
Hoje o site **esconde** blocos sem imagem (capa, sobre); no redesign a moldura reserva o espaço para
o layout não desmontar. Ver decisão D3.

## 6. Plano de execução

Cada etapa é um commit/PR separado, roda `npm run typecheck`, `npm test`, `npm run lint` e
`npm run build`, e tem capturas em 390px e 1440px, nos temas claro e escuro.

| Etapa | Entrega | Arquivos principais |
|---|---|---|
| **02 — Fundação** | Tokens do `DESIGN.md` em variáveis CSS, fontes novas no `next/font`, Tailwind apontando para os tokens, base tipográfica, `MediaFrame`, `SectionHead`, `PageHead`. Reset das classes de contrato (`btn`, `field`, `input`…) no novo estilo | `globals.css`, `layout.tsx`, `tailwind.config.ts`, `components/ui/*` |
| **03 — Moldura do site** | Header/nav novos, menu mobile, rodapé, WhatsApp, transição de página, `Motion` sem parallax | `(site)/layout.tsx`, `SiteHeader`, `Motion`, `template.tsx` |
| **04 — Home** | As 8 seções da home | `(site)/page.tsx`, `Cards.tsx` |
| **05 — Portfólio** | Tatuagens, detalhe do trabalho, estilos | `tatuagens/*`, `estilos`, `PortfolioBrowser`, `Gallery` |
| **06 — Flash e preços** | Projetos e preços | `projetos`, `precos`, `FlashCard` |
| **07 — Agendamento e fluxos do cliente** | Agendar, reserva, retorno de pagamento, cadastro, ficha. Sem mudar validação, chamadas de API ou regras | `BookingForm`, `SlotPicker`, `ClientRequest`, `SignupForm`, `FichaForm`, páginas |
| **08 — Simulador** | Layout de ferramenta, controles, câmera | `simulator/*`, `.sim-*` |
| **09 — Páginas de apoio e SEO** | Políticas, 404, `opengraph-image` com nova tipografia | `politicas`, `not-found`, `opengraph-image.tsx` |
| **10 — Painel** | Harmonização com os tokens, revisão de todas as telas, dica de proporção no `ImageInput` | `admin/**` (só apresentação), `.admin-*`, `.panel` |
| **11 — Revisão final** | Responsivo 360→1920, contraste, teclado, leitores de tela, reduced-motion, Lighthouse, fluxo completo de agendamento em modo de teste do Mercado Pago | — |

**Pré-requisito para as capturas:** o app não abre sem Supabase (`getArtist()` lança erro). É preciso
um projeto Supabase de desenvolvimento com as migrations e o `seed.sql`, e as chaves num `.env.local`
neste ambiente. Também dá para usar um branch do banco atual. O Mercado Pago pode ficar em modo de teste.

## 7. Decisões pendentes

- **D1 — Imagem de inspiração:** ✔ recebida na Etapa 02 (fundo preto, fotos P&B, títulos leves em caixa
  alta, rótulos espaçados, destaque verde-limão).
- **D2 — Tipografia:** ✔ Space Grotesk (títulos) + Inter (texto), paleta definida pelo cliente. Ver `DESIGN.md`.
- **Caveiras:** ✔ removidas de todo o site e do painel a pedido do cliente (Etapa 02).
- **D3 — Espaço sem imagem no site publicado:** (a) moldura neutra **com** o rótulo "IMAGEM · 4:5" (bom
  enquanto o site não foi lançado); (b) moldura neutra **sem** rótulo; (c) esconder o bloco, como hoje.
  Recomendação: (a) até o lançamento e (c) depois, controlado por uma configuração.
- **D4 — Cor de destaque:** manter o campo `accent_color` do painel com papel mínimo (proposta) ou deixar o site 100% monocromático.
- **D5 — `site-estatico/`:** deixar como está ou atualizar depois para o novo visual.
- **D6 — Painel:** só harmonizar (proposta) ou redesenhar também.

---

## 8. Situação ao fim da etapa 08

Concluído (numeração das etapas pedidas pelo cliente): 01 análise · 02 sistema visual e estrutura global ·
03 topo · 04 diferenciais e portfólio · 05 simulador e sobre · 06 projetos e depoimentos · 07 contato e rodapé ·
08 responsividade e acabamento.

Ainda no layout anterior (com os tokens novos, sem defeitos encontrados na revisão): páginas internas
`/tatuagens`, `/estilos`, `/precos`, `/agendar`, `/simulador`, `/politicas`, `/cadastro`, `/reserva`,
`/pagamento/retorno` e a faixa do Instagram da página inicial.

Migrations novas a rodar no Supabase, em ordem: 0007, 0008, 0009, 0010 (validadas num PostgreSQL 16 local).
