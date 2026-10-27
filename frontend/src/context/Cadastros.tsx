import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { api } from '../api/client';
import type { Pessoa, TipoProblema } from '../api/types';
import { useAsync } from '../lib/useAsync';

interface Cadastros {
  pessoas: Pessoa[];
  tipos: TipoProblema[];
  pessoa: (id: number) => Pessoa | undefined;
  tipo: (id: number) => TipoProblema | undefined;
  recarregar: () => void;
}

const Ctx = createContext<Cadastros | null>(null);

// Pessoas e tipos são poucos e aparecem em quase toda tela (nomes, selects),
// então carregamos uma vez e compartilhamos.
export function CadastrosProvider({ children }: { children: ReactNode }) {
  const pessoas = useAsync(() => api.pessoas.listar(), []);
  const tipos = useAsync(() => api.tipos.listar(), []);

  const valor = useMemo<Cadastros | null>(() => {
    if (!pessoas.dados || !tipos.dados) return null;
    const mapaPessoas = new Map(pessoas.dados.map((p) => [p.id, p]));
    const mapaTipos = new Map(tipos.dados.map((t) => [t.id, t]));
    return {
      pessoas: pessoas.dados,
      tipos: tipos.dados,
      pessoa: (id) => mapaPessoas.get(id),
      tipo: (id) => mapaTipos.get(id),
      recarregar: () => {
        pessoas.recarregar();
        tipos.recarregar();
      },
    };
  }, [pessoas.dados, tipos.dados]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!valor) {
    const erro = pessoas.erro ?? tipos.erro;
    return (
      <div className="carregando-global">
        {erro ? <p className="erro">{erro}</p> : <p>Carregando…</p>}
      </div>
    );
  }
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useCadastros() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCadastros fora do CadastrosProvider');
  return v;
}
