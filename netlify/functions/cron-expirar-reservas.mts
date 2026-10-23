// Tarefa agendada da Netlify: libera reservas vencidas e limpa o anti-spam (todo dia, 06:00 de Brasília).
// Na Vercel isso é feito pelo vercel.json.
export default async () => {
  const site = process.env.URL;
  const res = await fetch(`${site}/api/cron/expirar-reservas`, { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
  console.log('expirar-reservas', res.status, await res.text());
};

export const config = { schedule: '0 9 * * *' };
