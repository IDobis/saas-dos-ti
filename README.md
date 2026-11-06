# OSQ-Resolve

Sistema de chamados para suporte de tecnologia (help desk / service desk).

Plataforma para registrar e acompanhar problemas de computadores, sistemas, redes e demais recursos de TI: cadastros, abertura e classificação de chamados, encaminhamento a técnicos, histórico, prazos, avaliação e painel de indicadores.

A modelagem do fluxo e do inventário básico se inspira no [GLPI](https://glpi-project.org/), sem pretender replicá-lo. O foco é um SaaS enxuto com as práticas essenciais de atendimento.

**Entrega atual:** [06/11/2026, implementação, integração e testes](docs/entrega-06-11.md)

## Equipe

Bryan Mateus Peres, Lucas Teixeira Dobis, Arthur Hartman Callaça e Maria Fernanda Souza da Silva.

Repositório: https://github.com/IDobis/saas-dos-ti

## Tecnologias

| Parte | Tecnologias |
| --- | --- |
| Front-end (`apps/web`) | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Tremor |
| API (`apps/api`) | NestJS 11, Prisma 6, JWT, bcrypt |
| Banco | PostgreSQL 18 |

Detalhes em [stack](docs/stack.md) e [arquitetura](docs/arquitetura.md).

## Situação das funcionalidades

**Disponíveis:**

- Login, cadastro da organização e permissões por perfil, com limite de tentativas
- Cadastro e inativação de setores e usuários
- Abertura de chamado com categoria, prioridade e prazo calculado
- Lista com busca, filtro por status e prioridade, e ordenação
- Atribuição de técnico, mudança de status com transições válidas e cancelamento com justificativa
- Histórico automático, follow-ups e notas internas
- Avaliação do atendimento pelo solicitante
- Painel com indicadores e gráficos
- Monitor de SLA, modo manutenção, reabertura com causa e indicador de reincidência
- Isolamento dos dados por organização

**Parciais:**

- Filtros por categoria, técnico, setor, solicitante e período: só na API
- Filtro de período no painel: só na API
- Especialidade do técnico: só na API; não há edição de usuário
- SLA: usa o padrão por prioridade; o administrador ainda não ajusta

**Pendentes:**

- Anexos (RF14): só o modelo de dados existe
- Equipamentos (RF04): só o modelo de dados existe

Estado por requisito em [rastreabilidade](docs/rastreabilidade.md).

## Como executar

**Pré-requisitos:** Node.js (testado com 24.16) e PostgreSQL com um banco criado.

```bash
# 1. Instalar dependências
npm install
npm install --prefix apps/api
npm install --prefix apps/web

# 2. Configurar a API: copie o modelo e preencha DATABASE_URL e JWT_SECRET
cp apps/api/.env.example apps/api/.env

# 3. Preparar o banco
cd apps/api
npx prisma migrate deploy
npx prisma generate
cd ../..

# 4. Subir API e front juntos
npm run dev
```

| Serviço | Endereço |
| --- | --- |
| Front-end | http://localhost:3100 |
| API | http://localhost:3001/api |

**Primeiro acesso:** o projeto não tem usuário inicial. Em `/login`, use "Cadastre sua organização": quem cadastra vira administrador e cria os demais em Cadastros. O botão **Demo** gera chamados de exemplo, porém sem prazo de SLA.

**Depois de um `git pull`:** pare a API e repita o passo 3. Com a API rodando no Windows, o `prisma generate` pode falhar com `EPERM`, e migrations não aplicadas causam erro de coluna inexistente.

**Testes:** com a API no ar, rode `node docs/testes/executar-casos-api.mjs`. Veja [casos de teste](docs/casos-de-teste.md).

## Documentação

**Entrega e acompanhamento**

- [Entrega de 06/11/2026](docs/entrega-06-11.md)
- [Backlog](docs/backlog.md)
- [Casos de teste](docs/casos-de-teste.md)
- [Rastreabilidade](docs/rastreabilidade.md)
- [Lista de atividades](docs/atribuicao.md)

**Requisitos**

- [Requisitos funcionais](docs/requisitos-funcionais.md)
- [Requisitos não funcionais](docs/requisitos-nao-funcionais.md)
- [Regras de negócio](docs/regras-de-negocio.md)

**Arquitetura e modelagem**

- [Arquitetura](docs/arquitetura.md)
- [Stack](docs/stack.md)
- [Diagrama de classes](docs/diagrama-de-classes.md)
- [Diagrama de casos de uso](docs/diagrama-casos-de-uso.md)
- [Diagramas de atividades](docs/diagrama-atividades.md)
- [Modelo conceitual](docs/modelo-conceitual.md)
- [Entrega 2](entrega-2-osq-resolve/entrega-2-modelagem.md)

## Próximos passos até 27/11/2026

1. Corrigir o erro de tipo em `apps/web/src/components/reincidencia.tsx:80`.
2. Implementar anexos e equipamentos.
3. Levar para a tela os filtros que só existem na API.
4. Permitir ao administrador ajustar o SLA.
5. Completar a edição de usuário e criar testes automatizados.

Responsáveis e critérios em [backlog](docs/backlog.md).
