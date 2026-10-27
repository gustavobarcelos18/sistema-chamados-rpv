import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import type { TipoProblema } from '../api/types';
import { Cabecalho, Campo, Switch, Vazio } from '../components/ui';
import { useCadastros } from '../context/Cadastros';
import { useToast } from '../context/Toast';

export function Tipos() {
  const { tipos, recarregar } = useCadastros();
  const toast = useToast();
  const [nome, setNome] = useState('');
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const nomeOk = nome.trim().length > 0;
  const lista = [...tipos].sort((a, b) => Number(b.ativo) - Number(a.ativo) || a.nome.localeCompare(b.nome, 'pt-BR'));

  async function criar(e: FormEvent) {
    e.preventDefault();
    setTentou(true);
    if (!nomeOk) return;
    setEnviando(true);
    try {
      await api.tipos.criar(nome.trim());
      toast.ok(`Tipo "${nome.trim()}" criado.`);
      setNome('');
      setTentou(false);
      recarregar();
    } catch (err) {
      toast.erro(mensagem(err));
    } finally {
      setEnviando(false);
    }
  }

  async function alterarStatus(t: TipoProblema, ativo: boolean) {
    try {
      await api.tipos.alterarStatus(t.id, ativo);
      toast.ok(`${t.nome} ${ativo ? 'ativado' : 'desativado'}.`);
      recarregar();
    } catch (err) {
      toast.erro(mensagem(err));
    }
  }

  async function remover(t: TipoProblema) {
    if (!window.confirm(`Remover o tipo "${t.nome}"?`)) return;
    try {
      await api.tipos.remover(t.id);
      toast.ok(`${t.nome} removido.`);
      recarregar();
    } catch (err) {
      // Regra 7: tipo já usado em chamados só pode ser desativado. A mensagem vem da API.
      toast.erro(mensagem(err));
    }
  }

  return (
    <div className="pagina">
      <Cabecalho kicker="Cadastro" titulo="Tipos de problema" />
      <p className="lede">
        É o que o solicitante escolhe ao abrir um chamado: “Rede”, “Impressora”, “Acesso ao sistema”. Tipos
        desativados saem das opções de novos chamados, mas continuam nos antigos.
      </p>

      <div className="duas-colunas">
        <form className="bloco formulario" onSubmit={criar} noValidate>
          <h2 className="bloco-titulo">Novo tipo</h2>
          <Campo rotulo="Nome" htmlFor="t-nome" erro={tentou && !nomeOk ? 'Informe o nome do tipo.' : null}>
            <input id="t-nome" value={nome} maxLength={191} placeholder="Ex.: Rede e internet" onChange={(e) => setNome(e.target.value)} />
          </Campo>
          <button type="submit" className="botao botao-primario largo" disabled={enviando}>
            {enviando ? 'Criando…' : 'Criar tipo'}
          </button>
        </form>

        <section className="bloco">
          <h2 className="bloco-titulo">
            Tipos cadastrados <span className="contagem">{tipos.length}</span>
          </h2>
          {lista.length === 0 && <Vazio titulo="Nenhum tipo cadastrado. Sem tipo, não dá para abrir chamados." />}
          <ul className="lista">
            {lista.map((t) => (
              <li key={t.id} className={`linha ${t.ativo ? '' : 'inativa'}`}>
                <span className="tipo-marca" aria-hidden>
                  {t.nome.charAt(0).toUpperCase()}
                </span>
                <div className="linha-texto">
                  <strong>{t.nome}</strong>
                  <span className="mono">{t.ativo ? 'ativo' : 'desativado'}</span>
                </div>
                <div className="linha-acoes">
                  <Switch checked={t.ativo} label={`${t.ativo ? 'Desativar' : 'Ativar'} ${t.nome}`} onChange={(v) => alterarStatus(t, v)} />
                  <button className="link perigo" onClick={() => remover(t)}>
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="meta">Tipo já usado em chamados não pode ser removido, só desativado.</p>
        </section>
      </div>
    </div>
  );
}

function mensagem(e: unknown) {
  return e instanceof ApiError ? e.message : 'Algo deu errado. Tente de novo.';
}
