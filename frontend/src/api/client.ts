import type {
  Chamado,
  ChamadoDetalhe,
  FiltrosChamados,
  NovaPessoa,
  NovoChamado,
  Pessoa,
  Situacao,
  TipoProblema,
} from './types';

const BASE = import.meta.env.VITE_API_URL ?? '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

// O NestJS devolve `message` como string ou como array (erros do class-validator).
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Não foi possível conectar à API. Ela está rodando?', 0);
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const raw = data?.message ?? `Erro ${res.status}`;
    const message = Array.isArray(raw) ? raw.join('. ') : String(raw);
    throw new ApiError(message, res.status);
  }
  return data as T;
}

const query = (filtros: object) => {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filtros)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : '';
};

export const api = {
  pessoas: {
    listar: () => request<Pessoa[]>('GET', '/pessoas'),
    criar: (dto: NovaPessoa) => request<Pessoa>('POST', '/pessoas', dto),
    alterarStatus: (id: number, ativo: boolean) =>
      request<Pessoa>('PATCH', `/pessoas/${id}/status`, { ativo }),
    remover: (id: number) => request<Pessoa>('DELETE', `/pessoas/${id}`),
  },
  tipos: {
    listar: () => request<TipoProblema[]>('GET', '/tipos-problema'),
    criar: (nome: string) => request<TipoProblema>('POST', '/tipos-problema', { nome }),
    alterarStatus: (id: number, ativo: boolean) =>
      request<TipoProblema>('PATCH', `/tipos-problema/${id}/status`, { ativo }),
    remover: (id: number) => request<TipoProblema>('DELETE', `/tipos-problema/${id}`),
  },
  chamados: {
    listar: (filtros: FiltrosChamados = {}) =>
      request<Chamado[]>('GET', `/chamados${query(filtros)}`),
    buscar: (id: number) => request<ChamadoDetalhe>('GET', `/chamados/${id}`),
    criar: (dto: NovoChamado) => request<Chamado>('POST', '/chamados', dto),
    designar: (id: number, tecnicoId: number) =>
      request<Chamado>('PATCH', `/chamados/${id}/designar`, { tecnicoId }),
    mudarSituacao: (id: number, situacao: Situacao) =>
      request<Chamado>('PATCH', `/chamados/${id}/situacao`, { situacao }),
    comentar: (id: number, autorId: number, texto: string) =>
      request<unknown>('POST', `/chamados/${id}/comentarios`, { autorId, texto }),
  },
};
