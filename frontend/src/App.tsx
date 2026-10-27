import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { CadastrosProvider, useCadastros } from './context/Cadastros';
import { ToastProvider } from './context/Toast';
import { Painel } from './pages/Painel';
import { NovoChamado } from './pages/NovoChamado';
import { Chamado } from './pages/Chamado';
import { Pessoas } from './pages/Pessoas';
import { Tipos } from './pages/Tipos';
import { Vazio } from './components/ui';

export function App() {
  return (
    <ToastProvider>
      <CadastrosProvider>
        <Shell />
      </CadastrosProvider>
    </ToastProvider>
  );
}

function Shell() {
  const { pessoas, tipos } = useCadastros();
  const location = useLocation();
  const ativos = pessoas.filter((p) => p.ativo).length;
  const tiposAtivos = tipos.filter((t) => t.ativo).length;

  return (
    <div className="app">
      <aside className="nav">
        <div className="marca">
          <span className="marca-selo">§</span>
          <div>
            <strong>Mesa de Chamados</strong>
            <small>suporte interno</small>
          </div>
        </div>

        <nav>
          <NavLink
            to="/chamados"
            end
            className={() => (painelAtivo(location.pathname) ? 'ativo' : '')}
          >
            <span className="nav-num">01</span> Painel
          </NavLink>
          <NavLink to="/chamados/novo" end>
            <span className="nav-num">02</span> Abrir chamado
          </NavLink>
          <NavLink to="/pessoas">
            <span className="nav-num">03</span> Pessoas
            <em>{ativos}</em>
          </NavLink>
          <NavLink to="/tipos">
            <span className="nav-num">04</span> Tipos de problema
            <em>{tiposAtivos}</em>
          </NavLink>
        </nav>

        <p className="nav-rodape">
          Cada chamado tem um responsável, uma conversa e um ciclo de vida.
        </p>
      </aside>

      <main className="conteudo">
        <Routes>
          <Route path="/" element={<Navigate to="/chamados" replace />} />
          <Route path="/chamados" element={<Painel />} />
          <Route path="/chamados/novo" element={<NovoChamado />} />
          <Route path="/chamados/:id" element={<Chamado />} />
          <Route path="/pessoas" element={<Pessoas />} />
          <Route path="/tipos" element={<Tipos />} />
          <Route
            path="*"
            element={
              <Vazio titulo="Esta página não existe.">
                <NavLink to="/chamados">Voltar ao painel</NavLink>
              </Vazio>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

// "Painel" cobre /chamados e o detalhe de cada chamado, mas não o formulário de abertura.
const painelAtivo = (path: string) =>
  path === '/chamados' || (path.startsWith('/chamados/') && path !== '/chamados/novo');
