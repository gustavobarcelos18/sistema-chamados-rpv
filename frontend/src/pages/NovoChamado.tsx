import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { Prioridade } from '../api/types';
import { Campo, Cabecalho, Vazio } from '../components/ui';
import { useCadastros } from '../context/Cadastros';
import { useToast } from '../context/Toast';
import { DESCRICAO_MIN, ORDEM_PRIORIDADES, PRIORIDADES, TITULO } from '../lib/dominio';

export function NovoChamado() {
  const navigate = useNavigate();
  const toast = useToast();
  const { pessoas, tipos, recarregar } = useCadastros();

  const solicitantes = pessoas.filter((p) => p.tipo === 'SOLICITANTE' && p.ativo);
  const tiposAtivos = tipos.filter((t) => t.ativo);

  const [solicitanteId, setSolicitanteId] = useState<number | ''>('');
  const [tipoProblemaId, setTipoProblemaId] = useState<number | ''>('');
  const [prioridade, setPrioridade] = useState<Prioridade>('MEDIA');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroServidor, setErroServidor] = useState<string | null>(null);

  const tituloLen = titulo.trim().length;
  const descLen = descricao.trim().length;

  const erros = {
    solicitante: solicitanteId === '' ? 'Escolha quem está pedindo ajuda.' : null,
    tipo: tipoProblemaId === '' ? 'Escolha o tipo do problema.' : null,
    titulo:
      tituloLen < TITULO.min
        ? `Use pelo menos ${TITULO.min} caracteres.`
        : tituloLen > TITULO.max
          ? `Limite de ${TITULO.max} caracteres.`
          : null,
    descricao: descLen < DESCRICAO_MIN ? `Descreva com pelo menos ${DESCRICAO_MIN} caracteres.` : null,
  };
  const valido = Object.values(erros).every((e) => e === null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setTentou(true);
    setErroServidor(null);
    if (!valido || solicitanteId === '' || tipoProblemaId === '') return;

    setEnviando(true);
    try {
      const chamado = await api.chamados.criar({
        solicitanteId,
        tipoProblemaId,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        prioridade,
      });
      toast.ok(`Chamado #${String(chamado.id).padStart(4, '0')} aberto.`);
      navigate(`/chamados/${chamado.id}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Não foi possível abrir o chamado.';
      setErroServidor(msg);
      if (err instanceof ApiError && err.status === 404) recarregar();
    } finally {
      setEnviando(false);
    }
  }

  if (solicitantes.length === 0 || tiposAtivos.length === 0) {
    return (
      <div className="pagina">
        <Cabecalho kicker="Novo chamado" titulo="Antes de abrir, faltam cadastros" />
        <Vazio titulo="Para abrir um chamado é preciso ter ao menos:">
          <ul className="lista-simples">
            {solicitantes.length === 0 && (
              <li>
                um solicitante ativo — <Link to="/pessoas">cadastrar pessoa</Link>
              </li>
            )}
            {tiposAtivos.length === 0 && (
              <li>
                um tipo de problema ativo — <Link to="/tipos">cadastrar tipo</Link>
              </li>
            )}
          </ul>
        </Vazio>
      </div>
    );
  }

  return (
    <div className="pagina pagina-estreita">
      <Cabecalho kicker="Novo chamado" titulo="Descreva o problema" />

      <form className="formulario" onSubmit={enviar} noValidate>
        <div className="grade-2">
          <Campo rotulo="Quem está pedindo ajuda" htmlFor="solicitante" erro={tentou ? erros.solicitante : null}>
            <select
              id="solicitante"
              value={solicitanteId}
              onChange={(e) => setSolicitanteId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Selecione…</option>
              {solicitantes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </Campo>

          <Campo rotulo="Tipo do problema" htmlFor="tipo" erro={tentou ? erros.tipo : null}>
            <select
              id="tipo"
              value={tipoProblemaId}
              onChange={(e) => setTipoProblemaId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Selecione…</option>
              {tiposAtivos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <Campo rotulo="Urgência" dica="Quanto mais alta, mais rápido o chamado sobe na fila do técnico.">
          <div className="prio-escolha" role="radiogroup" aria-label="Prioridade">
            {ORDEM_PRIORIDADES.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={prioridade === p}
                className={`prio-opcao prio-${p.toLowerCase()} ${prioridade === p ? 'on' : ''}`}
                onClick={() => setPrioridade(p)}
              >
                <span className="prio-barras" aria-hidden>
                  {[1, 2, 3, 4].map((n) => (
                    <i key={n} className={n <= PRIORIDADES[p].nivel ? 'on' : undefined} />
                  ))}
                </span>
                {PRIORIDADES[p].rotulo}
              </button>
            ))}
          </div>
        </Campo>

        <Campo
          rotulo="Título"
          htmlFor="titulo"
          erro={tentou ? erros.titulo : null}
          dica={
            <span className="contador">
              {tituloLen}/{TITULO.max}
            </span>
          }
        >
          <input
            id="titulo"
            value={titulo}
            maxLength={TITULO.max + 20}
            placeholder="Ex.: Sem internet no setor 3"
            onChange={(e) => setTitulo(e.target.value)}
            autoFocus
          />
        </Campo>

        <Campo
          rotulo="O que está acontecendo"
          htmlFor="descricao"
          erro={tentou ? erros.descricao : null}
          dica={<span className="contador">{descLen} caracteres</span>}
        >
          <textarea
            id="descricao"
            rows={6}
            value={descricao}
            placeholder="Quando começou, o que já foi tentado, o que aparece na tela…"
            onChange={(e) => setDescricao(e.target.value)}
          />
        </Campo>

        {erroServidor && <p className="erro">{erroServidor}</p>}

        <footer className="formulario-rodape">
          <Link to="/chamados" className="link">
            Cancelar
          </Link>
          <button type="submit" className="botao botao-primario" disabled={enviando}>
            {enviando ? 'Abrindo…' : 'Abrir chamado'}
          </button>
        </footer>
      </form>
    </div>
  );
}
