# Tattoin Line

Site profissional para tatuadores: mostra o portfólio, vende desenhos autorais, deixa o cliente testar a tatuagem na própria pele e agenda a sessão com pagamento de sinal online.

> **Projeto freelancer.** Desenvolvido por Julio Romulo como produto para venda a tatuadores e estúdios. Cada cliente recebe o site com a própria marca, domínio, portfólio e conta Mercado Pago — o dinheiro dos sinais cai direto na conta do tatuador. Interessado? Fale comigo: julyoviny@gmail.com

O objetivo é tirar o atendimento do "manda foto no direct" e transformar o site em uma recepção que funciona sozinha: o cliente vê os trabalhos, escolhe, simula, agenda e paga; o tatuador só confirma e tatua.

---

## O que o site faz

### Para o cliente
| Página | Função |
|---|---|
| **Início** | Capa, trabalhos e projetos em destaque escolhidos pelo tatuador, apresentação do artista, depoimentos de clientes e faixa do Instagram. |
| **Tatuagens** | Portfólio com filtro por estilo e galeria de fotos de cada trabalho. |
| **Projetos disponíveis** | Desenhos autorais (flash) com preço fechado, tamanho e duração. Cada desenho é tatuado uma única vez. |
| **Simulador** | O cliente envia uma foto (ou usa a câmera), escolhe um projeto ou o próprio desenho e posiciona na pele: arrastar, girar, mudar tamanho e opacidade, comparar antes/depois e baixar a imagem. **A foto não sai do aparelho do cliente.** |
| **Preços** | Faixas de valor por tamanho e regras de orçamento. |
| **Agendar** | Escolha do serviço, dia e horário livres, dados de contato e pagamento do sinal (ou valor integral) pelo Mercado Pago. Peças grandes viram pedido de orçamento. |
| **Minha reserva** | Link pessoal para acompanhar o agendamento, pedir reagendamento ou cancelar. |
| **Cadastro / Ficha** | Cadastro rápido (nome e telefone) e ficha completa opcional, com dados de saúde só com consentimento (LGPD). |

Em todas as páginas há um **botão flutuante de WhatsApp** com mensagem pronta, e o link do site gera uma **prévia com imagem** ao ser compartilhado.

### Para o tatuador (painel `/admin`)
- **Agenda:** pedidos, reservas, confirmações, orçamentos e ações (confirmar, reagendar, cancelar, marcar saldo pago).
- **Pagamentos:** o que entrou pelo Mercado Pago, conciliado automaticamente pelo webhook.
- **Portfólio, Projetos e Estilos:** cadastro de trabalhos e desenhos com fotos; nada aparece no site sem ser publicado.
- **Página inicial:** escolhe a foto de capa, a foto do "Sobre" e o que aparece em destaque.
- **Resumo financeiro:** recebido no mês (online e no estúdio), saldos a receber, sessões e ticket médio.
- **Depoimentos:** avaliações reais, publicadas só com autorização do cliente.
- **Clientes:** cadastro automático a cada agendamento, ficha, histórico e notas internas.
- **Disponibilidade e Configurações:** horários de atendimento, bloqueios, preços, sinal, políticas, contatos e identidade (nome do site, do artista e descrição para o Google).
- **Fotos otimizadas:** imagens grandes do celular são reduzidas no envio e perdem dados ocultos como a localização GPS.
- **Esqueci minha senha:** recuperação de acesso por e-mail.

### Regras que o sistema garante
- Dois clientes nunca conseguem o mesmo horário (bloqueio no próprio banco de dados).
- O horário fica reservado por alguns minutos enquanto o cliente paga; se não pagar, é liberado.
- Preço e disponibilidade são sempre conferidos no servidor, nunca confiados ao navegador.
- Pagamento só é considerado aprovado quando o Mercado Pago confirma (webhook assinado).
- Lembretes e avisos por e-mail/WhatsApp (opcionais).
- Proteção contra spam nos formulários, compartilhada entre os servidores.
- Contador de visitas (Vercel Analytics, sem cookies).
- Tema claro e escuro, animações suaves e layout pensado para celular.

---

## Para quem é
Tatuadores autônomos e estúdios que querem um site próprio, vender desenhos autorais e receber o sinal antes da sessão, sem depender só do Instagram. O mesmo sistema atende vários clientes: cada tatuador tem seu cadastro, seu painel e seus dados separados.

**O que está incluso na entrega:** configuração do site com a identidade do tatuador, domínio, banco de dados, integração com o Mercado Pago, cadastro inicial do portfólio e treinamento rápido do painel. Hospedagem e manutenção podem ser contratadas mensalmente.

---

## Tecnologia
Next.js 14 · React · TypeScript · Tailwind · Supabase (banco, login e arquivos) · Mercado Pago · Konva (simulador) · Vercel

---

## Rodar no computador
```bash
npm install
cp .env.example .env.local   # preencha as chaves do Supabase
npm run dev                  # abre em http://localhost:3000
```
Banco de dados: rode os arquivos de `supabase/migrations` em ordem e depois `supabase/seed.sql`.

## Publicar
Importe o repositório na Vercel, cole as variáveis do `.env.local` em *Environment Variables* e faça o deploy. Cada push no GitHub atualiza o site.

## Segurança
- Nunca envie o `.env.local` para o GitHub (já está no `.gitignore`).
- A chave `SUPABASE_SERVICE_ROLE_KEY` fica só no servidor.

---

Passo a passo detalhado (variáveis, Mercado Pago, testes e privacidade): [`docs/GUIA-COMPLETO.md`](docs/GUIA-COMPLETO.md)
