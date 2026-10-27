import type { ReactNode } from 'react';
import type { Pessoa, Prioridade, Situacao } from '../api/types';
import { PRIORIDADES, SITUACOES } from '../lib/dominio';
import { iniciais } from '../lib/format';

export function SituacaoBadge({ situacao }: { situacao: Situacao }) {
  const s = SITUACOES[situacao];
  return <span className={`badge badge-${s.cor}`}>{s.rotulo}</span>;
}

export function PrioridadeTag({ prioridade }: { prioridade: Prioridade }) {
  const p = PRIORIDADES[prioridade];
  return (
    <span className={`prio prio-${prioridade.toLowerCase()}`} title={`Prioridade ${p.rotulo.toLowerCase()}`}>
      <span className="prio-barras" aria-hidden>
        {[1, 2, 3, 4].map((n) => (
          <i key={n} className={n <= p.nivel ? 'on' : undefined} />
        ))}
      </span>
      {p.rotulo}
    </span>
  );
}

export function Avatar({ pessoa, tamanho = 'md' }: { pessoa: Pessoa | undefined; tamanho?: 'sm' | 'md' }) {
  if (!pessoa) return <span className={`avatar avatar-vazio avatar-${tamanho}`}>–</span>;
  return (
    <span
      className={`avatar avatar-${tamanho} avatar-${pessoa.tipo.toLowerCase()}`}
      title={`${pessoa.nome} (${pessoa.tipo === 'TECNICO' ? 'técnico' : 'solicitante'})`}
    >
      {iniciais(pessoa.nome)}
    </span>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`switch ${checked ? 'on' : ''}`}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

export function Campo({
  rotulo,
  dica,
  erro,
  children,
  htmlFor,
}: {
  rotulo: string;
  dica?: ReactNode;
  erro?: string | null;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className={`campo ${erro ? 'campo-erro' : ''}`}>
      <label htmlFor={htmlFor} className="campo-rotulo">
        {rotulo}
      </label>
      {children}
      {erro ? <small className="campo-msg">{erro}</small> : dica ? <small className="campo-dica">{dica}</small> : null}
    </div>
  );
}

export function Vazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="vazio">
      <p className="vazio-titulo">{titulo}</p>
      {children && <div className="vazio-corpo">{children}</div>}
    </div>
  );
}

export function Cabecalho({
  kicker,
  titulo,
  children,
}: {
  kicker: string;
  titulo: string;
  children?: ReactNode;
}) {
  return (
    <header className="cabecalho">
      <div>
        <p className="kicker">{kicker}</p>
        <h1>{titulo}</h1>
      </div>
      {children && <div className="cabecalho-acoes">{children}</div>}
    </header>
  );
}
