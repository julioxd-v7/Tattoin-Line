# Tattoin Line — site e agenda do tatuador (V1)

Aplicação web para um tatuador independente: portfólio, projetos autorais (flash), preços, agendamento com reserva temporária, pagamento de sinal ou valor integral pelo Mercado Pago, área do cliente e painel administrativo.

**Tema:** claro e escuro em todas as páginas e no painel — segue o sistema do visitante e tem um botão para alternar (a escolha fica salva no navegador).

**Stack:** Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Supabase (PostgreSQL, Auth, Storage) · Mercado Pago Checkout Pro · Resend (e-mail) · Vercel.

> **Estado desta entrega:** o código, o banco de dados e as regras de negócio foram escritos e testados em partes (veja "O que foi testado"). A instalação de pacotes npm estava bloqueada no ambiente onde o projeto foi gerado, então **`npm install`, `npm run typecheck` e `npm run build` precisam ser rodados por você antes de publicar**. Corrija qualquer erro apontado antes de seguir. Não use em produção antes de concluir o roteiro de testes no fim deste arquivo.

---

## 1. Estrutura

```
src/
  app/
    (site)/                 páginas públicas (início, tatuagens, projetos, estilos, preços, agendar, políticas)
    (site)/reserva/[token]  área do cliente (link secreto e não sequencial)
    (site)/pagamento/retorno  retorno do Mercado Pago (consulta o provedor, não confia na URL)
    admin/                  painel (login + páginas protegidas) e server actions
    api/disponibilidade     dias e horários livres (calculados no servidor)
    api/agendamentos        cria a reserva temporária + cobrança
    api/referencias         URLs assinadas para enviar imagens de referência
    api/webhooks/mercadopago  notificações assinadas do Mercado Pago
    api/reserva/[token]     pedidos de reagendamento/cancelamento do cliente
    api/cron/*              expiração de reservas e lembretes
  lib/
    pricing.ts              regras de preço/sinal (puras, testadas)
    availability.ts         cálculo de horários (puro, testado)
    booking.ts              criação, confirmação, expiração, reconciliação e cancelamento
    mercadopago.ts          API REST do Mercado Pago + validação de assinatura
    notify.ts               e-mails (Resend) e WhatsApp Cloud API (opcional)
supabase/
  migrations/0001_init.sql  tabelas, restrições, RLS, buckets e função de reserva atômica
  seed.sql                  dados demonstrativos
tests/                      testes unitários (vitest)
site-estatico/              versão estática (HTML/CSS/JS) do mesmo visual, para divulgação imediata
```

## 2. Regras importantes já implementadas

- **Sem horário duplicado:** restrição `EXCLUDE USING gist` no banco impede dois agendamentos ativos no mesmo intervalo (incluindo o intervalo entre sessões). A reserva roda na função `create_booking_hold`, com trava por artista, validação de horário de atendimento e bloqueios.
- **Projeto autoral reservado uma vez:** a função trava o projeto (`FOR UPDATE`), confere se está disponível e se o valor enviado é o mesmo do banco; um índice único impede dois agendamentos ativos para o mesmo desenho.
- **Valores congelados:** total, sinal, saldo e as condições aceitas são copiados para o agendamento (`terms_snapshot`). Mudar a tabela de preços não altera reservas antigas.
- **Status separados:** `status` (agenda) e `payment_status` (financeiro) são campos diferentes. Pagamento aprovado confirma a sessão, mas não a conclui.
- **Confirmação só pelo servidor:** o webhook valida `x-signature`, registra o evento uma única vez (`x-request-id`), consulta o pagamento na API e confere valor e moeda. A página de retorno também consulta o provedor; parâmetros da URL não confirmam nada.
- **Reserva temporária:** o horário fica segurado por `hold_minutes` (padrão 30). Ao vencer, o sistema consulta o Mercado Pago antes de liberar; pagamentos pendentes ganham 15 minutos de tolerância.
- **Pagamento tardio:** se um pagamento for aprovado depois que o horário foi dado a outra pessoa, a reserva **não** é confirmada: ela fica marcada "precisa de atenção" no painel para reembolso ou novo horário.
- **Notificações reais ou nenhuma:** sem `RESEND_API_KEY`, nada é enviado e o painel mostra "não configurado" (cada tentativa fica registrada em `customer_notifications`).

## 3. Instalação local

Pré-requisitos: Node.js 20+, conta no Supabase, conta no Mercado Pago (credenciais de teste) e, opcionalmente, Resend.

```bash
npm install
cp .env.example .env.local      # preencha as variáveis (seção 4)
npm run typecheck
npm test
npm run dev                     # http://localhost:3000
```

### 3.1 Supabase

1. Crie um projeto em supabase.com.
2. Em **SQL Editor**, rode `supabase/migrations/0001_init.sql` e depois `supabase/seed.sql`
   (ou, com a CLI: `supabase link` e `supabase db push`, depois rode o seed).
3. Em **Authentication > Users**, crie o usuário do tatuador (e-mail e senha forte). Desative o cadastro público em **Authentication > Providers > Email > Allow new users to sign up**.
4. Vincule o usuário ao artista:
   ```sql
   insert into public.profiles (id, artist_id, role)
   select '<UUID-DO-USUARIO>', id, 'owner' from public.artists where slug = 'caio-martins';
   ```
5. Copie URL, `anon key` e `service_role key` (Project Settings > API) para o `.env.local`.

### 3.2 Mercado Pago (ambiente de testes)

1. Em **Suas integrações**, crie uma aplicação (Checkout Pro).
2. Copie o **Access Token de teste** para `MERCADOPAGO_ACCESS_TOKEN`.
3. Em **Webhooks**, cadastre a URL `https://SEU-DOMINIO/api/webhooks/mercadopago`, evento **Pagamentos**, e copie a **assinatura secreta** para `MERCADOPAGO_WEBHOOK_SECRET`.
   Para testar localmente, exponha o servidor (ex.: `ngrok http 3000`) e use essa URL em `NEXT_PUBLIC_SITE_URL`.
4. Crie **contas de teste** (comprador e vendedor) em Suas integrações > Contas de teste e pague com os cartões de teste da documentação do Mercado Pago. Use o comprador de teste no checkout.

### 3.3 E-mail (Resend)

Crie a chave em resend.com, verifique o domínio e preencha `RESEND_API_KEY`, `EMAIL_FROM` e `ADMIN_NOTIFY_EMAIL`.

### 3.4 WhatsApp (etapa adicional)

O envio pela API oficial (WhatsApp Cloud API) está pronto em `lib/notify.ts`, mas só funciona com número verificado e um template aprovado pela Meta com um parâmetro de texto no corpo. Preencha `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` e `WHATSAPP_TEMPLATE_STATUS`. Sem isso, o painel informa que o WhatsApp não está configurado.

## 4. Variáveis de ambiente

Veja `.env.example`. Resumo:

| Variável | Onde é usada | Obrigatória |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | links, retorno e webhook | sim |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | navegador e servidor | sim |
| `SUPABASE_SERVICE_ROLE_KEY` | somente servidor | sim |
| `ARTIST_SLUG` | qual artista o site exibe | sim (padrão `caio-martins`) |
| `MERCADOPAGO_ACCESS_TOKEN` | cobranças | para agendar com pagamento |
| `MERCADOPAGO_WEBHOOK_SECRET` | validar notificações | sim, junto do token |
| `MERCADOPAGO_ENV` | aviso de teste/produção no painel | sim |
| `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL` | e-mails | recomendado |
| `WHATSAPP_*` | WhatsApp Cloud API | opcional |
| `CRON_SECRET` | proteger `/api/cron/*` | sim em produção |

Nenhum segredo usa o prefixo `NEXT_PUBLIC_`.

## 5. Publicação na Vercel

1. Suba o projeto para um repositório Git e importe na Vercel.
2. Cadastre todas as variáveis da seção 4 (Production e Preview).
3. Configure o domínio próprio e atualize `NEXT_PUBLIC_SITE_URL` e a URL do webhook no Mercado Pago.
4. **Cron:** o `vercel.json` agenda as rotas uma vez por dia (limite do plano Hobby). As reservas vencidas também são reconciliadas a cada consulta de agenda e nova reserva, mas recomenda-se um agendador externo a cada 5 minutos (ex.: cron-job.org) chamando:
   - `https://SEU-DOMINIO/api/cron/expirar-reservas` com o cabeçalho `Authorization: Bearer <CRON_SECRET>`
   - `https://SEU-DOMINIO/api/cron/lembretes` (a cada hora)

## 6. Ativar cobranças reais

1. Conclua o roteiro de testes (seção 8) em homologação com credenciais de teste.
2. No Mercado Pago, ative as **credenciais de produção** (pode exigir dados da conta e site publicado).
3. Troque `MERCADOPAGO_ACCESS_TOKEN` pelo token de produção, atualize `MERCADOPAGO_WEBHOOK_SECRET` (modo produção do webhook) e defina `MERCADOPAGO_ENV=production`.
4. Faça um pagamento real de valor baixo, confira confirmação, e-mail e painel, e reembolse pelo painel.

## 7. Painel do artista

`/admin` — visão geral (próximos agendamentos, solicitações, pagamentos pendentes, receita do mês só com pagamentos aprovados, projetos disponíveis, estado das integrações), agenda por dia/semana/mês, detalhe de cada agendamento (enviar orçamento, reagendar, concluir, cancelar com ou sem reembolso, consultar status no Mercado Pago, resolver alertas), pagamentos, portfólio (com autorização do cliente obrigatória para publicar), projetos, estilos, horários e bloqueios, preços e configurações. Toda alteração administrativa e financeira relevante fica em `admin_audit_log` e `appointment_events`.

## 7.1 Simulador de tatuagens (/simulador)

- O cliente escolhe um projeto (ou um desenho próprio em PNG/WebP), envia uma foto ou usa a câmera e posiciona o desenho: arrastar, tamanho, rotação, opacidade, desfazer/refazer, ver sem o desenho e baixar a imagem.
- **A foto do cliente nunca é enviada ao servidor.** Fica só na memória do navegador.
- Para um projeto aparecer no simulador: no painel, em Projetos → editar, envie a **Imagem para o simulador** (PNG ou WebP com fundo transparente, só o traço) e deixe "Mostrar no simulador" marcado. O projeto também precisa estar Disponível.
- Cada card de projeto ganha o link "Ver no meu corpo"; o botão "Agendar esta tatuagem" confere se o projeto ainda está livre e abre o agendamento normal (preço e horário são validados de novo no servidor). O agendamento fica marcado como "Veio do simulador" no painel.
- A câmera só funciona em HTTPS (na Vercel, sim) ou em `localhost`.
- Migração: `supabase/migrations/0004_simulator.sql` (já aplicada no seu projeto).
- Dependências novas: `konva` e `react-konva` — rode `npm install` de novo.

## 8. O que foi testado e o que falta testar

Testado durante a geração:
- Migração e seed aplicados num PostgreSQL 16 local (com stubs de `auth` e `storage`).
- Função de reserva: horário duplicado recusado, intervalo entre sessões respeitado, fora do horário recusado, valor divergente recusado, projeto reservado duas vezes recusado, orçamento sem data, liberação do projeto após expiração, histórico de status.
- Pagamento tardio em horário já ocupado: a reativação é bloqueada pelo banco (vira alerta no painel).
- Testes unitários (`npm test`): preços e sinal, cálculo de horários e fuso, assinatura do webhook e mapeamento de status — 20 casos.
- Checagem de sintaxe e de imports de todos os arquivos TypeScript e checagem de tipos da lógica de servidor.

**Ainda precisa ser feito por você (não foi possível sem instalar os pacotes e sem credenciais):**
- `npm install && npm run typecheck && npm run lint && npm run build`.
- Roteiro manual em homologação, com credenciais de teste:
  1. Abrir o site no computador e no celular.
  2. Filtrar e pesquisar trabalhos; abrir um trabalho e copiar o link.
  3. Cadastrar uma tatuagem no painel (com foto) e vê-la no site.
  4. Criar um projeto com preço e reservá-lo pelo site.
  5. Agendar uma sessão escolhendo data; tentar o mesmo horário em outra aba (deve ser recusado).
  6. Pagar no checkout de teste; conferir webhook, status "Confirmado", e-mail e painel.
  7. Deixar uma reserva vencer sem pagar; rodar `/api/cron/expirar-reservas`; o horário deve voltar a ficar livre.
  8. Na área do cliente, pedir reagendamento e cancelamento; confirmar no painel.
  9. Cancelar com reembolso pelo painel e conferir o estorno no Mercado Pago.
  10. Verificar mensagens de erro (sem conexão, horário ocupado, campos inválidos).

## 9. Privacidade e segurança

- Coleta mínima: nome, e-mail, WhatsApp e dados da ideia. Referências ficam em bucket **privado**; o painel gera links temporários.
- Cartões são processados apenas pelo Mercado Pago; o sistema nunca recebe número ou código de segurança.
- RLS ativo em todas as tabelas. Visitantes só leem conteúdo publicado; agendamentos e pagamentos só são escritos pelo servidor.
- Formulários com validação no cliente e no servidor (zod), campo-armadilha anti-spam e limite de tentativas por IP (em memória; para várias instâncias, use um armazenamento compartilhado como Upstash).
- Revise os textos de privacidade e cancelamento com um profissional. Para pedidos de acesso/exclusão de dados (LGPD), localize o cliente por e-mail em `appointments` e anonimize os campos pessoais, mantendo os registros financeiros pelo prazo legal.

## 10. Fora do escopo da V1

Marketplace, vários tatuadores independentes, aplicativo nativo, fidelidade e automações de marketing. A estrutura (`artist_id` em todas as tabelas) permite evoluir sem refazer o banco.
