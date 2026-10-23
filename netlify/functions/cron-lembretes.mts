// Tarefa agendada da Netlify: envia lembretes das sessões (todo dia, 09:00 de Brasília).
export default async () => {
  const site = process.env.URL;
  const res = await fetch(`${site}/api/cron/lembretes`, { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
  console.log('lembretes', res.status, await res.text());
};

export const config = { schedule: '0 12 * * *' };
