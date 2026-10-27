// Espelha prisma/schema.prisma.

export type TipoPessoa = 'SOLICITANTE' | 'TECNICO';
export type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type Situacao = 'ABERTO' | 'EM_ATENDIMENTO' | 'RESOLVIDO' | 'FECHADO' | 'CANCELADO';

export interface Pessoa {
  id: number;
  nome: string;
  email: string;
  tipo: TipoPessoa;
  ativo: boolean;
}

export interface TipoProblema {
  id: number;
  nome: string;
  ativo: boolean;
}

export interface Chamado {
  id: number;
  titulo: string;
  descricao: string;
  prioridade: Prioridade;
  situacao: Situacao;
  criadoEm: string;
  resolvidoEm: string | null;
  solicitanteId: number;
  tecnicoId: number | null;
  tipoProblemaId: number;
}

export interface Comentario {
  id: number;
  texto: string;
  criadoEm: string;
  chamadoId: number;
  autorId: number;
  autor: Pessoa;
}

// Resposta de GET /chamados/:id
export interface ChamadoDetalhe extends Chamado {
  solicitante: Pessoa;
  tecnico: Pessoa | null;
  tipoProblema: TipoProblema;
  comentarios: Comentario[];
}

export interface FiltrosChamados {
  situacao?: Situacao;
  prioridade?: Prioridade;
  tipoProblemaId?: number;
  tecnicoId?: number;
}

export interface NovoChamado {
  solicitanteId: number;
  tipoProblemaId: number;
  titulo: string;
  descricao: string;
  prioridade?: Prioridade;
}

export interface NovaPessoa {
  nome: string;
  email: string;
  tipo: TipoPessoa;
}
