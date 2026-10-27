# Sistema de Chamados

API de chamados de suporte (NestJS + Prisma + MySQL) que implementa as regras de negócio do documento "Sistema de Chamados: Regras de Negócio".

## Pré-requisitos

- Node.js 22 LTS ou superior
- Docker (para o MySQL)

## Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Configurar o ambiente
cp .env.example .env

# 3. Subir o MySQL
docker compose up -d

# 4. Criar as tabelas e gerar o client do Prisma
npx prisma migrate dev --name init
npx prisma generate

# 5. Iniciar a API (http://localhost:3000)
npm run start:dev
```

## Rotas

| Método | Rota | Ação | Regras |
|---|---|---|---|
| POST | `/pessoas` | Cadastra solicitante ou técnico | 1, 2 |
| GET | `/pessoas` | Lista pessoas | |
| PATCH | `/pessoas/:id/status` | Ativa ou desativa (`{"ativo": false}`) | 3 |
| DELETE | `/pessoas/:id` | Remove, se não houver histórico | 4 |
| POST | `/tipos-problema` | Cadastra tipo de problema | 5 |
| GET | `/tipos-problema` | Lista tipos | |
| PATCH | `/tipos-problema/:id/status` | Ativa ou desativa | 6 |
| DELETE | `/tipos-problema/:id` | Remove, se não houver chamados | 7 |
| POST | `/chamados` | Abre chamado | 6, 8–11 |
| GET | `/chamados` | Lista, com filtros `situacao`, `prioridade`, `tipoProblemaId`, `tecnicoId` | |
| GET | `/chamados/:id` | Mostra o chamado com a conversa | |
| PATCH | `/chamados/:id/designar` | Designa técnico (`{"tecnicoId": 2}`) | 12, 13, 17, 18 |
| PATCH | `/chamados/:id/situacao` | Muda a situação (`{"situacao": "RESOLVIDO"}`) | 14–16 |
| POST | `/chamados/:id/comentarios` | Comenta (`{"autorId": 2, "texto": "..."}`) | 19–21 |

## Exemplo de fluxo

```bash
curl -X POST localhost:3000/pessoas -H 'Content-Type: application/json' \
  -d '{"nome":"Ana","email":"ana@empresa.com","tipo":"SOLICITANTE"}'
curl -X POST localhost:3000/pessoas -H 'Content-Type: application/json' \
  -d '{"nome":"Bruno","email":"bruno@empresa.com","tipo":"TECNICO"}'
curl -X POST localhost:3000/tipos-problema -H 'Content-Type: application/json' -d '{"nome":"Rede"}'
curl -X POST localhost:3000/chamados -H 'Content-Type: application/json' \
  -d '{"solicitanteId":1,"tipoProblemaId":1,"titulo":"Sem internet no setor 3","descricao":"Cabo de rede sem sinal desde cedo"}'
curl -X PATCH localhost:3000/chamados/1/designar -H 'Content-Type: application/json' -d '{"tecnicoId":2}'
curl -X POST localhost:3000/chamados/1/comentarios -H 'Content-Type: application/json' \
  -d '{"autorId":2,"texto":"Vou checar o switch"}'
curl -X PATCH localhost:3000/chamados/1/situacao -H 'Content-Type: application/json' -d '{"situacao":"RESOLVIDO"}'
```

## Estrutura

```
prisma/schema.prisma        modelos e enums
src/
  prisma/                   PrismaService e PrismaModule (global)
  common/dto/               DTOs compartilhados
  pessoas/                  cadastro e status de pessoas
  tipos-problema/           cadastro e status de tipos de problema
  chamados/                 abertura, designação, situação e comentários
```

## Premissas

- **Autenticação:** fora do escopo. `solicitanteId` e `autorId` vêm no corpo da requisição. Em produção, o usuário deve vir do token.
- **Quem muda a situação:** o documento não define. Hoje qualquer envolvido pode mudar. Para restringir ao técnico, valide `autorId` em `ChamadosService.mudarSituacao`.
- **Reabertura (`RESOLVIDO → EM_ATENDIMENTO`):** mantém o técnico atual e não altera `resolvidoEm`.
- **Histórico de resoluções (regra 16):** `resolvidoEm` guarda só a última resolução. Para registrar todas, crie uma tabela de eventos.
- **Concorrência:** as transações em nível `Serializable` impedem designações duplicadas e estouro do limite de 5 chamados por técnico.

## Frontend

Interface web em [`frontend/`](frontend/README.md) (React + Vite). Com a API rodando:

```bash
cd frontend && npm install && npm run dev   # http://localhost:5173
```
