const data = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const dataCurta = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });

const relativo = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

export const formatarData = (iso: string) => data.format(new Date(iso)).replace('.', '');

export const formatarDataCurta = (iso: string) => dataCurta.format(new Date(iso)).replace('.', '');

export function tempoRelativo(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const min = 60_000;
  const hora = 60 * min;
  const dia = 24 * hora;
  if (abs < min) return 'agora';
  if (abs < hora) return relativo.format(Math.round(diff / min), 'minute');
  if (abs < dia) return relativo.format(Math.round(diff / hora), 'hour');
  return relativo.format(Math.round(diff / dia), 'day');
}

export const iniciais = (nome: string) =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');

export const codigo = (id: number) => `#${String(id).padStart(4, '0')}`;
