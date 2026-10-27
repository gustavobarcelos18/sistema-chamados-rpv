import { useCallback, useEffect, useRef, useState } from 'react';

interface Estado<T> {
  dados: T | undefined;
  erro: string | null;
  carregando: boolean;
  recarregar: () => void;
}

// Carrega dados ao montar (e quando `deps` mudam). `recarregar` refaz a busca.
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): Estado<T> {
  const [dados, setDados] = useState<T>();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    fnRef
      .current()
      .then((d) => {
        if (!ativo) return;
        setDados(d);
        setErro(null);
      })
      .catch((e: Error) => ativo && setErro(e.message))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const recarregar = useCallback(() => setTick((t) => t + 1), []);
  return { dados, erro, carregando, recarregar };
}
