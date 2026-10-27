# Mesa de Chamados (frontend)

Interface web para a API de chamados (`../README.md`). React + TypeScript + Vite, sem biblioteca de componentes.

## Como rodar

```bash
# com a API rodando em http://localhost:3000
cd frontend
npm install
npm run dev        # http://localhost:5173
```

O Vite encaminha `/api/*` para a API (sem CORS). Para apontar para outra API:

```bash
API_PROXY=http://servidor:3001 npm run dev
```

Para build de produção:

```bash
npm run build      # gera dist/ (estático)
```

Em produção, sirva `dist/` pelo mesmo domínio da API em `/api` (proxy reverso). Se preferir outra origem, defina `VITE_API_URL` antes do build.

## Telas

| Rota | O que faz |
|---|---|
| `/chamados` | Quadro com uma coluna por situação. Filtros de prioridade, tipo e técnico ficam na URL. |
| `/chamados/:id` | Detalhe com ciclo de vida, conversa, designação de técnico e próximas transições. |
| `/chamados/novo` | Abertura de chamado com as mesmas validações do backend. |
| `/pessoas` | Cadastro, ativação/desativação e remoção de solicitantes e técnicos. |
| `/tipos` | Cadastro, ativação/desativação e remoção de tipos de problema. |

## Regras refletidas na interface

A API continua sendo a fonte da verdade. A interface só evita oferecer ações que ela recusaria:

- Designação só em chamado aberto e sem responsável; técnico desativado ou lotado (5 em atendimento) fica indisponível.
- Transições da regra 14: cada botão mostra só os próximos estados válidos. Fechar e cancelar pedem confirmação.
- Comentários só para quem abriu o chamado ou o técnico responsável; chamado encerrado não recebe mensagem.
- Pessoa ou tipo com histórico não é removido; a mensagem da API explica e sugere desativar.

## Estrutura

```
src/
  api/          cliente HTTP e tipos espelhando prisma/schema.prisma
  context/      cadastros compartilhados (pessoas, tipos) e avisos
  lib/          regras de domínio, formatação de datas, hook de carregamento
  components/   badges, avatares, switch, campos
  pages/        uma tela por arquivo
  styles.css    tokens de cor (claro e escuro) e layout
```

## Limitações conhecidas

- Não há login. Quem está "escrevendo como" é escolhido na tela, como a API já pede no corpo da requisição.
- A lista de chamados não traz nomes; eles são cruzados com `/pessoas` e `/tipos` no cliente. Para muitos registros, vale um endpoint que já devolva os nomes.
