import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Chamado, Prioridade, Situacao } from '../api/types';
import { Avatar, Cabecalho, PrioridadeTag, Vazio } from '../components/ui';
import { useCadastros } from '../context/Cadastros';
import { ORDEM_PRIORIDADES, ORDEM_SITUACOES, PRIORIDADES, SITUACOES } from '../lib/dominio';
import { codigo, tempoRelativo } from '../lib/format';
import { useAsync } from '../lib/useAsync';

export function Painel() {
  const [params, setParams] = useSearchParams();
  const prioridade = (params.get('prioridade') as Prioridade | null) ?? undefined;
  const tipoProblemaId = params.get('tipo') ? Number(params.get('tipo')) : undefined;
  const tecnicoId = params.get('tecnico') ? Number(params.get('tecnico')) : undefined;

  const { pessoa, tipo, tipos, pessoas } = useCadastros();
  const chamados = useAsync(
    () => api.chamados.listar({ prioridade, tipoProblemaId, tecnicoId }),
    [prioridade, tipoProblemaId, tecnicoId],
  );

  const definir = (chave: string, valor: string | null) => {
    const next = new URLSearchParams(params);
    if (valor) next.set(chave, valor);
    else next.delete(chave);
    setParams(next, { replace: true });
  };

  const tecnicos = pessoas.filter((p) => p.tipo === 'TECNICO' && p.ativo);
  const colunas = agrupar(chamados.dados ?? []);
  const total = chamados.dados?.length ?? 0;
  const emAberto = colunas.ABERTO.length + colunas.EM_ATENDIMENTO.length;

  return (
    <div className="pagina">
      <Cabecalho
        kicker={`${emAberto} em aberto · ${total} no total`}
        titulo="Painel de chamados"
      >
        <Link to="/chamados/novo" className="botao botao-primario">
          Abrir chamado
        </Link>
      </Cabecalho>

      <div className="filtros" role="toolbar" aria-label="Filtros">
        <div className="segmentado" role="radiogroup" aria-label="Prioridade">
          <button
            role="radio"
            aria-checked={!prioridade}
            className={!prioridade ? 'on' : ''}
            onClick={() => definir('prioridade', null)}
          >
            Todas
          </button>
          {ORDEM_PRIORIDADES.map((p) => (
            <button
              key={p}
              role="radio"
              aria-checked={prioridade === p}
              className={`${prioridade === p ? 'on' : ''} seg-${p.toLowerCase()}`}
              onClick={() => definir('prioridade', p)}
            >
              {PRIORIDADES[p].rotulo}
            </button>
          ))}
        </div>

        <label className="select-inline">
          <span>Tipo</span>
          <select value={tipoProblemaId ?? ''} onChange={(e) => definir('tipo', e.target.value || null)}>
            <option value="">Todos</option>
            {tipos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
                {!t.ativo ? ' (desativado)' : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="select-inline">
          <span>Técnico</span>
          <select value={tecnicoId ?? ''} onChange={(e) => definir('tecnico', e.target.value || null)}>
            <option value="">Todos</option>
            {tecnicos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </label>

        {(prioridade || tipoProblemaId || tecnicoId) && (
          <button className="link" onClick={() => setParams({}, { replace: true })}>
            Limpar filtros
          </button>
        )}
      </div>

      {chamados.erro && <p className="erro">{chamados.erro}</p>}

      {!chamados.dados && !chamados.erro && <p className="carregando">Carregando chamados…</p>}

      {chamados.dados && (
        <div className="quadro">
          {ORDEM_SITUACOES.map((s) => (
            <section key={s} className={`coluna coluna-${SITUACOES[s].cor}`}>
              <header>
                <h2>{SITUACOES[s].rotulo}</h2>
                <span className="contagem">{colunas[s].length}</span>
              </header>
              <div className="coluna-corpo">
                {colunas[s].length === 0 && <p className="coluna-vazia">{SITUACOES[s].resumo}</p>}
                {colunas[s].map((c) => (
                  <Link key={c.id} to={`/chamados/${c.id}`} className="card">
                    <div className="card-topo">
                      <span className="codigo">{codigo(c.id)}</span>
                      <PrioridadeTag prioridade={c.prioridade} />
                    </div>
                    <h3>{c.titulo}</h3>
                    <p className="card-tipo">
                      {tipo(c.tipoProblemaId)?.nome ?? 'Tipo removido'}
                      <time dateTime={c.criadoEm}>{tempoRelativo(c.criadoEm)}</time>
                    </p>
                    <div className="card-rodape">
                      <Avatar pessoa={c.tecnicoId ? pessoa(c.tecnicoId) : undefined} tamanho="sm" />
                      <span className="card-tec">
                        {c.tecnicoId ? pessoa(c.tecnicoId)?.nome : 'Sem técnico'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {chamados.dados && total === 0 && (
        <Vazio titulo="Nenhum chamado com esses filtros.">
          <Link to="/chamados/novo">Abrir o primeiro chamado</Link>
        </Vazio>
      )}
    </div>
  );
}

function agrupar(lista: Chamado[]): Record<Situacao, Chamado[]> {
  const colunas: Record<Situacao, Chamado[]> = {
    ABERTO: [],
    EM_ATENDIMENTO: [],
    RESOLVIDO: [],
    FECHADO: [],
    CANCELADO: [],
  };
  // Mais recentes primeiro em cada coluna.
  for (const c of [...lista].reverse()) colunas[c.situacao].push(c);
  return colunas;
}
