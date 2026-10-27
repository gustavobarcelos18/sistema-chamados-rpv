import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type Tipo = 'ok' | 'erro';
interface Aviso {
  id: number;
  tipo: Tipo;
  texto: string;
}

interface ToastApi {
  ok: (texto: string) => void;
  erro: (texto: string) => void;
}

const Ctx = createContext<ToastApi | null>(null);
let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const empilhar = useCallback((tipo: Tipo, texto: string) => {
    const id = ++seq;
    setAvisos((a) => [...a, { id, tipo, texto }]);
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), tipo === 'erro' ? 6000 : 3500);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      ok: (t) => empilhar('ok', t),
      erro: (t) => empilhar('erro', t),
    }),
    [empilhar],
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {avisos.map((a) => (
          <div key={a.id} className={`toast toast-${a.tipo}`}>
            {a.texto}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useToast fora do ToastProvider');
  return v;
}
