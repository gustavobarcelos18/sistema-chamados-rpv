import { useMemo, useState, type KeyboardEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { ChamadoDetalhe, Pessoa, Situacao } from '../api/types';
import { Avatar, Cabecalho, PrioridadeTag, SituacaoBadge, Vazio } from '../components/ui';
import { useCadastros } from '../context/Cadastros';
import { useToast } from '../context/Toast';
import { ENCERRADO, LIMITE_EM_ATENDIMENTO, SITUACOES, TRANSICOES } from '../lib/dominio';
import { codigo, formatarData } from '../lib/format';
import { useAsync } from '../lib/useAsync';

// Texto e confirmação de cada transição (regra 14).
const ACAO: Partial<Record<Situacao, { rotulo: string; desc: string; confirma?: string }>> = {
  EM_ATENDIMENTO: { rotulo: 'Reabrir atendimento', desc: 'Volta para o mesmo técnico.' },
  RESOLVIDO: { rotulo: 'Marcar como resolvido', desc: 'Registra a data da resolução.' },
  FECHADO: {
    rotulo: 'Fechar chamado',
    desc: 'Encerra de vez. Não aceita mais comentários.',
    confirma: 'Fechar o chamado? Ele não poderá mais ser alterado.',
  },
  CANCELADO: {
    rotulo: 'Cancelar chamado',
    desc: 'Encerra sem solução.',
    confirma: 'Cancelar o chamado? Essa ação encerra o chamado.',
  },
};

export function Chamado() {
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const { pessoas } = useCadastros();

  const detalhe = useAsync(() => api.chamados.buscar(id), [id]);
  // Carga atual de cada técnico (regra 17), para mostrar antes de tentar designar.
  const emAtendimento = useAsync(() => api.chamados.listar({ situacao: 'EM_ATENDIMENTO' }), [id]);

  const cargas = useMemo(() => {
    const mapa = new Map<number, number>();
    for (const c of emAtendimento.dados ?? []) {
      if (c.tecnicoId) mapa.set(c.tecnicoId, (mapa.get(c.tecnicoId) ?? 0) + 1);
    }
    return mapa;
  }, [emAtendimento.dados]);

  if (detalhe.erro) {
    return (
      <div className="pagina">
        <Vazio titulo={detalhe.erro}>
          <Link to="/chamados">Voltar ao painel</Link>
        </Vazio>
      </div>
    );
  }
  if (!detalhe.dados) return <p className="carregando">Carregando chamado…</p>;

  const c = detalhe.dados;
  const recarregar = () => {
    detalhe.recarregar();
    emAtendimento.recarregar();
  };

  return (
    <div className="pagina">
      <Link to="/chamados" className="voltar">
        ← Painel
      </Link>

      <Cabecalho kicker={`Chamado ${codigo(c.id)} · ${c.tipoProblema.nome}`} titulo={c.titulo}>
        <SituacaoBadge situacao={c.situacao} />
        <PrioridadeTag prioridade={c.prioridade} />
      </Cabecalho>

      <Trilha situacao={c.situacao} resolvidoEm={c.resolvidoEm} />

      <div className="detalhe">
        <div className="detalhe-principal">
          <section className="bloco">
            <h2 className="bloco-titulo">Descrição</h2>
            <p className="descricao">{c.descricao}</p>
            <p className="meta">
              Aberto por <strong>{c.solicitante.nome}</strong> em {formatarData(c.criadoEm)}
            </p>
          </section>

          <Conversa chamado={c} onComentou={recarregar} />
        </div>

        <aside className="detalhe-lateral">
          <section className="bloco">
            <h2 className="bloco-titulo">Responsável</h2>
            <PessoaLinha pessoa={c.solicitante} papel="Solicitante" />
            <PessoaLinha pessoa={c.tecnico ?? undefined} papel="Técnico" vazio="Ainda sem técnico" />
          </section>

          {c.situacao === 'ABERTO' && !c.tecnicoId && (
            <Designar
              chamado={c}
              tecnicos={pessoas.filter((p) => p.tipo === 'TECNICO' && p.ativo && p.id !== c.solicitanteId)}
              cargas={cargas}
              onDesignado={recarregar}
            />
          )}

          <Acoes chamado={c} cargas={cargas} onMudou={recarregar} />
        </aside>
      </div>
    </div>
  );
}

function PessoaLinha({ pessoa, papel, vazio }: { pessoa: Pessoa | undefined; papel: string; vazio?: string }) {
  return (
    <div className="pessoa-linha">
      <Avatar pessoa={pessoa} />
      <div>
        <small>{papel}</small>
        {pessoa ? (
          <>
            <strong>{pessoa.nome}</strong>
            <span className="mono">{pessoa.email}</span>
          </>
        ) : (
          <em>{vazio}</em>
        )}
      </div>
    </div>
  );
}

// Linha do ciclo de vida. Cancelado não passa pelas etapas: vira um estado final isolado.
function Trilha({ situacao, resolvidoEm }: { situacao: Situacao; resolvidoEm: string | null }) {
  if (situacao === 'CANCELADO') {
    return (
      <ol className="trilha trilha-cancelada" aria-label="Ciclo de vida">
        <li className="agora">
          <span className="trilha-no" />
          <span className="trilha-rotulo">Cancelado</span>
        </li>
      </ol>
    );
  }

  const etapas: Situacao[] = ['ABERTO', 'EM_ATENDIMENTO', 'RESOLVIDO', 'FECHADO'];
  const atual = etapas.indexOf(situacao);

  return (
    <ol className="trilha" aria-label="Ciclo de vida">
      {etapas.map((e, i) => {
        const feito = atual >= i;
        const agora = atual === i;
        return (
          <li key={e} className={`${feito ? 'feito' : ''} ${agora ? 'agora' : ''}`}>
            <span className="trilha-no" />
            <span className="trilha-rotulo">{SITUACOES[e].rotulo}</span>
            {e === 'RESOLVIDO' && resolvidoEm && feito && <small>{formatarData(resolvidoEm)}</small>}
          </li>
        );
      })}
    </ol>
  );
}

function Conversa({ chamado, onComentou }: { chamado: ChamadoDetalhe; onComentou: () => void }) {
  const toast = useToast();
  const encerrado = ENCERRADO(chamado.situacao);
  const participantes = [chamado.solicitante, chamado.tecnico].filter(Boolean) as Pessoa[];
  const [autorId, setAutorId] = useState<number>(chamado.solicitanteId);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    const limpo = texto.trim();
    if (!limpo || enviando) return;
    setEnviando(true);
    try {
      await api.chamados.comentar(chamado.id, autorId, limpo);
      setTexto('');
      onComentou();
    } catch (e) {
      toast.erro(e instanceof ApiError ? e.message : 'Não foi possível enviar o comentário.');
    } finally {
      setEnviando(false);
    }
  }

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) enviar();
  };

  return (
    <section className="bloco conversa">
      <h2 className="bloco-titulo">
        Conversa <span className="contagem">{chamado.comentarios.length}</span>
      </h2>

      {chamado.comentarios.length === 0 && <p className="conversa-vazia">Nenhuma mensagem ainda.</p>}

      <ol className="mensagens">
        {chamado.comentarios.map((m) => {
          const lado = m.autorId === chamado.tecnicoId ? 'direita' : 'esquerda';
          return (
            <li key={m.id} className={`mensagem ${lado}`}>
              <div className="mensagem-cabeca">
                <strong>{m.autor.nome}</strong>
                <span className={`papel papel-${m.autor.tipo === 'TECNICO' ? 'tecnico' : 'solicitante'}`}>
                  {m.autor.tipo === 'TECNICO' ? 'técnico' : 'solicitante'}
                </span>
                <time dateTime={m.criadoEm}>{formatarData(m.criadoEm)}</time>
              </div>
              <p>{m.texto}</p>
            </li>
          );
        })}
      </ol>

      {encerrado ? (
        <p className="aviso">
          Chamado {SITUACOES[chamado.situacao].rotulo.toLowerCase()}. A conversa está fechada.
        </p>
      ) : (
        <div className="composer">
          <div className="composer-quem">
            <span>Escrevendo como</span>
            <div className="segmentado pequeno" role="radiogroup" aria-label="Autor do comentário">
              {participantes.map((p) => (
                <button
                  key={p.id}
                  role="radio"
                  aria-checked={autorId === p.id}
                  className={autorId === p.id ? 'on' : ''}
                  onClick={() => setAutorId(p.id)}
                >
                  {p.nome}
                </button>
              ))}
            </div>
          </div>
          <textarea
            rows={3}
            value={texto}
            placeholder="Escreva uma atualização… (Ctrl+Enter envia)"
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={onKey}
            aria-label="Novo comentário"
          />
          <div className="composer-rodape">
            <small>Comentários não podem ser editados nem apagados.</small>
            <button className="botao botao-primario" onClick={enviar} disabled={!texto.trim() || enviando}>
              {enviando ? 'Enviando…' : 'Comentar'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Designar({
  chamado,
  tecnicos,
  cargas,
  onDesignado,
}: {
  chamado: ChamadoDetalhe;
  tecnicos: Pessoa[];
  cargas: Map<number, number>;
  onDesignado: () => void;
}) {
  const toast = useToast();
  const [escolhido, setEscolhido] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function designar() {
    if (escolhido === null) return;
    setEnviando(true);
    try {
      await api.chamados.designar(chamado.id, escolhido);
      toast.ok('Técnico designado. O chamado está em atendimento.');
      onDesignado();
    } catch (e) {
      toast.erro(e instanceof ApiError ? e.message : 'Não foi possível designar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="bloco designar">
      <h2 className="bloco-titulo">Designar técnico</h2>
      {tecnicos.length === 0 && <p className="meta">Nenhum técnico ativo disponível.</p>}
      <div role="radiogroup" aria-label="Técnicos" className="tecnicos">
        {tecnicos.map((t) => {
          const carga = cargas.get(t.id) ?? 0;
          const lotado = carga >= LIMITE_EM_ATENDIMENTO;
          return (
            <button
              key={t.id}
              role="radio"
              aria-checked={escolhido === t.id}
              disabled={lotado}
              className={`tecnico ${escolhido === t.id ? 'on' : ''}`}
              onClick={() => setEscolhido(t.id)}
            >
              <Avatar pessoa={t} tamanho="sm" />
              <span className="tecnico-nome">{t.nome}</span>
              <span className="carga" aria-label={`${carga} de ${LIMITE_EM_ATENDIMENTO} chamados`}>
                {Array.from({ length: LIMITE_EM_ATENDIMENTO }, (_, i) => (
                  <i key={i} className={i < carga ? 'cheio' : ''} />
                ))}
                <em>{lotado ? 'lotado' : `${carga}/${LIMITE_EM_ATENDIMENTO}`}</em>
              </span>
            </button>
          );
        })}
      </div>
      <button className="botao botao-primario largo" disabled={escolhido === null || enviando} onClick={designar}>
        {enviando ? 'Designando…' : 'Confirmar designação'}
      </button>
      <small className="meta">Designar tira o chamado da fila e não tem volta.</small>
    </section>
  );
}

function Acoes({
  chamado,
  cargas,
  onMudou,
}: {
  chamado: ChamadoDetalhe;
  cargas: Map<number, number>;
  onMudou: () => void;
}) {
  const toast = useToast();
  const [enviando, setEnviando] = useState<Situacao | null>(null);
  const proximas = TRANSICOES[chamado.situacao];

  if (proximas.length === 0) return null;

  // Reabrir (RESOLVIDO → EM_ATENDIMENTO) também respeita o limite da regra 17.
  const cargaTecnico = chamado.tecnicoId ? (cargas.get(chamado.tecnicoId) ?? 0) : 0;
  const lotadoParaReabrir = cargaTecnico >= LIMITE_EM_ATENDIMENTO;

  async function mudar(nova: Situacao) {
    const acao = ACAO[nova];
    if (acao?.confirma && !window.confirm(acao.confirma)) return;
    setEnviando(nova);
    try {
      await api.chamados.mudarSituacao(chamado.id, nova);
      toast.ok(`Situação: ${SITUACOES[nova].rotulo}.`);
      onMudou();
    } catch (e) {
      toast.erro(e instanceof ApiError ? e.message : 'Não foi possível mudar a situação.');
    } finally {
      setEnviando(null);
    }
  }

  return (
    <section className="bloco">
      <h2 className="bloco-titulo">Próximo passo</h2>
      <div className="acoes">
        {proximas.map((nova) => {
          const acao = ACAO[nova]!;
          const bloqueado = nova === 'EM_ATENDIMENTO' && lotadoParaReabrir;
          return (
            <button
              key={nova}
              className={`acao ${nova === 'CANCELADO' ? 'acao-perigo' : ''}`}
              disabled={bloqueado || enviando !== null}
              onClick={() => mudar(nova)}
            >
              <strong>{enviando === nova ? 'Aplicando…' : acao.rotulo}</strong>
              <span>
                {bloqueado ? `Técnico já tem ${LIMITE_EM_ATENDIMENTO} chamados em atendimento.` : acao.desc}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
