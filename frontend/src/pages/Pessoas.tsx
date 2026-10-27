import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import type { Pessoa, TipoPessoa } from '../api/types';
import { Avatar, Campo, Cabecalho, Switch, Vazio } from '../components/ui';
import { useCadastros } from '../context/Cadastros';
import { useToast } from '../context/Toast';

type Filtro = 'TODAS' | TipoPessoa;

export function Pessoas() {
  const { pessoas, recarregar } = useCadastros();
  const toast = useToast();
  const [filtro, setFiltro] = useState<Filtro>('TODAS');

  const lista = pessoas
    .filter((p) => filtro === 'TODAS' || p.tipo === filtro)
    .sort((a, b) => Number(b.ativo) - Number(a.ativo) || a.nome.localeCompare(b.nome, 'pt-BR'));

  async function alterarStatus(p: Pessoa, ativo: boolean) {
    try {
      await api.pessoas.alterarStatus(p.id, ativo);
      toast.ok(`${p.nome} ${ativo ? 'ativado' : 'desativado'}.`);
      recarregar();
    } catch (e) {
      toast.erro(mensagem(e));
    }
  }

  async function remover(p: Pessoa) {
    if (!window.confirm(`Remover ${p.nome}? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.pessoas.remover(p.id);
      toast.ok(`${p.nome} removido.`);
      recarregar();
    } catch (e) {
      // Regra 4: quem já tem histórico só pode ser desativado. A mensagem vem da API.
      toast.erro(mensagem(e));
    }
  }

  return (
    <div className="pagina">
      <Cabecalho kicker="Cadastro" titulo="Pessoas" />

      <div className="duas-colunas">
        <NovaPessoa onCriada={recarregar} />

        <section className="bloco">
          <div className="bloco-cabeca">
            <h2 className="bloco-titulo">Quem está no sistema</h2>
            <div className="segmentado pequeno" role="radiogroup" aria-label="Filtrar por tipo">
              {(['TODAS', 'SOLICITANTE', 'TECNICO'] as Filtro[]).map((f) => (
                <button key={f} role="radio" aria-checked={filtro === f} className={filtro === f ? 'on' : ''} onClick={() => setFiltro(f)}>
                  {f === 'TODAS' ? 'Todas' : f === 'TECNICO' ? 'Técnicos' : 'Solicitantes'}
                </button>
              ))}
            </div>
          </div>

          {lista.length === 0 && <Vazio titulo="Ninguém por aqui ainda." />}

          <ul className="lista">
            {lista.map((p) => (
              <li key={p.id} className={`linha ${p.ativo ? '' : 'inativa'}`}>
                <Avatar pessoa={p} />
                <div className="linha-texto">
                  <strong>{p.nome}</strong>
                  <span className="mono">{p.email}</span>
                </div>
                <span className={`papel papel-${p.tipo === 'TECNICO' ? 'tecnico' : 'solicitante'}`}>
                  {p.tipo === 'TECNICO' ? 'técnico' : 'solicitante'}
                </span>
                <div className="linha-acoes">
                  <Switch checked={p.ativo} label={`${p.ativo ? 'Desativar' : 'Ativar'} ${p.nome}`} onChange={(v) => alterarStatus(p, v)} />
                  <button className="link perigo" onClick={() => remover(p)}>
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="meta">Quem já abriu chamado ou comentou não pode ser removido, só desativado.</p>
        </section>
      </div>
    </div>
  );
}

function NovaPessoa({ onCriada }: { onCriada: () => void }) {
  const toast = useToast();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState<TipoPessoa>('SOLICITANTE');
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const erros = {
    nome: nome.trim() ? null : 'Informe o nome.',
    email: emailOk ? null : 'E-mail inválido.',
  };

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setTentou(true);
    if (erros.nome || erros.email) return;
    setEnviando(true);
    try {
      await api.pessoas.criar({ nome: nome.trim(), email: email.trim(), tipo });
      toast.ok(`${nome.trim()} cadastrado como ${tipo === 'TECNICO' ? 'técnico' : 'solicitante'}.`);
      setNome('');
      setEmail('');
      setTentou(false);
      onCriada();
    } catch (err) {
      toast.erro(mensagem(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="bloco formulario" onSubmit={enviar} noValidate>
      <h2 className="bloco-titulo">Cadastrar pessoa</h2>

      <div className="segmentado largo" role="radiogroup" aria-label="Tipo">
        {(['SOLICITANTE', 'TECNICO'] as TipoPessoa[]).map((t) => (
          <button key={t} type="button" role="radio" aria-checked={tipo === t} className={tipo === t ? 'on' : ''} onClick={() => setTipo(t)}>
            {t === 'TECNICO' ? 'Técnico' : 'Solicitante'}
          </button>
        ))}
      </div>
      <p className="meta">
        {tipo === 'TECNICO'
          ? 'Técnicos recebem chamados. Cada um atende até 5 ao mesmo tempo.'
          : 'Solicitantes abrem chamados e acompanham a conversa.'}
      </p>

      <Campo rotulo="Nome completo" htmlFor="p-nome" erro={tentou ? erros.nome : null}>
        <input id="p-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
      </Campo>
      <Campo rotulo="E-mail" htmlFor="p-email" erro={tentou ? erros.email : null}>
        <input id="p-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Campo>

      <button type="submit" className="botao botao-primario largo" disabled={enviando}>
        {enviando ? 'Cadastrando…' : 'Cadastrar'}
      </button>
    </form>
  );
}

function mensagem(e: unknown) {
  return e instanceof ApiError ? e.message : 'Algo deu errado. Tente de novo.';
}
