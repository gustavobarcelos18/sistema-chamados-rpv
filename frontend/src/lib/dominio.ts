import type { Prioridade, Situacao } from '../api/types';

// Espelho das regras do backend (ChamadosService). O servidor continua sendo a
// fonte da verdade; aqui só evitamos oferecer ações que ele vai recusar.

export const SITUACOES: Record<Situacao, { rotulo: string; cor: string; resumo: string }> = {
  ABERTO: { rotulo: 'Aberto', cor: 'aberto', resumo: 'Aguardando técnico' },
  EM_ATENDIMENTO: { rotulo: 'Em atendimento', cor: 'atendimento', resumo: 'Com técnico' },
  RESOLVIDO: { rotulo: 'Resolvido', cor: 'resolvido', resumo: 'Pode ser reaberto' },
  FECHADO: { rotulo: 'Fechado', cor: 'fechado', resumo: 'Encerrado' },
  CANCELADO: { rotulo: 'Cancelado', cor: 'cancelado', resumo: 'Encerrado' },
};

export const ORDEM_SITUACOES: Situacao[] = [
  'ABERTO',
  'EM_ATENDIMENTO',
  'RESOLVIDO',
  'FECHADO',
  'CANCELADO',
];

export const PRIORIDADES: Record<Prioridade, { rotulo: string; nivel: number }> = {
  BAIXA: { rotulo: 'Baixa', nivel: 1 },
  MEDIA: { rotulo: 'Média', nivel: 2 },
  ALTA: { rotulo: 'Alta', nivel: 3 },
  CRITICA: { rotulo: 'Crítica', nivel: 4 },
};

export const ORDEM_PRIORIDADES: Prioridade[] = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];

// Regra 14
export const TRANSICOES: Record<Situacao, Situacao[]> = {
  ABERTO: ['CANCELADO'],
  EM_ATENDIMENTO: ['RESOLVIDO', 'CANCELADO'],
  RESOLVIDO: ['FECHADO', 'EM_ATENDIMENTO'],
  FECHADO: [],
  CANCELADO: [],
};

export const LIMITE_EM_ATENDIMENTO = 5; // regra 17

export const ENCERRADO = (s: Situacao) => s === 'FECHADO' || s === 'CANCELADO';

export const TITULO = { min: 5, max: 100 }; // regra 10
export const DESCRICAO_MIN = 10; // regra 10
