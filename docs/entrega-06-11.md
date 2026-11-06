# Entrega de 06/11/2026: implementação, integração e testes

| | |
| --- | --- |
| **Disciplina** | Fábrica de Software, Prof. Sabine Cassol |
| **Projeto** | OSQ-Resolve, sistema de chamados para suporte de TI |
| **Repositório** | https://github.com/IDobis/saas-dos-ti |
| **Versão da entrega** | Tag `entrega-06-11-2026` (a criar; ver [Como marcar a versão](#como-marcar-a-versão)) |

## Equipe

| Integrante | RA |
| --- | --- |
| Bryan Mateus Peres | 25202975-2 |
| Lucas Teixeira Dobis | 25161083-2 |
| Arthur Hartman Callaça | 25098730-2 |
| Maria Fernanda Souza da Silva | 25363540-2 |

## Documentos da entrega

| Documento | Conteúdo |
| --- | --- |
| [README](../README.md) | Visão geral, instalação e execução |
| [Arquitetura](arquitetura.md) | Tecnologias, diagrama e pastas |
| [Backlog](backlog.md) | Tarefas, responsáveis, prazos e situação |
| [Casos de teste](casos-de-teste.md) | Casos executados e resultados |
| [Evidências](testes/evidencias/README.md) | Resultado da API e prints a tirar |
| [Rastreabilidade](rastreabilidade.md) | Requisito, código, teste e estado |
| [Requisitos funcionais](requisitos-funcionais.md) | RF01 a RF16 e histórico de alterações |
| [Regras de negócio](regras-de-negocio.md) | RN01 a RN14 |
| [Entrega 2](../entrega-2-osq-resolve/entrega-2-modelagem.md) | Casos de uso e modelagem |

## O que mudou

**Desde a Entrega 2 (08/09/2026) até 20/10/2026:**

- MVP integrado de ponta a ponta: login, cadastros, chamados, histórico, avaliação e painel.
- Revisão visual das telas e calendário.

**Desde 20/10/2026:**

- Monitor de SLA: semáforo na lista, contagem regressiva no detalhe e bloco "Em risco" no painel.
- Modo manutenção: o administrador bloqueia escritas e a organização vê um aviso.
- Reabertura com causa obrigatória e indicador de reincidência no painel.
- Segurança: usuário validado no banco a cada requisição, limite de tentativas em `/auth` e bcrypt nativo.
- Botão Demo apaga só o que gerou.
- Melhorias de tela: ícones animados, confirmação de saída, transições, menus e login.
- Esta documentação e a execução dos casos de teste.

## Escopo do bimestre e recorte da demonstração

**Prioridade do bimestre:** o ciclo completo do chamado, com regras de negócio aplicadas na API, antes de ampliar cadastros e extras.

**Fluxo a demonstrar:**

1. Login e cadastros como administrador (RF13, RF01, RF03).
2. Abrir chamado (RF05, RF06, RF15, RN01, RN02).
3. Listar e filtrar por busca, status e prioridade (RF12).
4. Tentar iniciar sem técnico e depois atribuir (RF07, RN03).
5. Mudar status e ver o histórico (RF08, RF09, RN04, RN05).
6. Registrar follow-up e nota interna (RN12).
7. Resolver e avaliar (RF10, RN07).
8. Ver o painel (RF11) e o semáforo de SLA.
9. Ativar e encerrar o modo manutenção.
10. Reabrir com causa e ver a reincidência (RN13).

**Fora do recorte:** anexos (RF14) e equipamentos (RF04), que ainda não existem na API nem na tela.

**Resultado dos testes:** 116 de 116 verificações pela API e fluxo principal conferido na tela. Ressalvas e casos não executáveis estão em [casos de teste](casos-de-teste.md).

## Cuidados para a demonstração

- **Chamados do botão Demo não têm prazo de SLA.** Para mostrar o semáforo, abra um chamado pelo formulário.
- **Limite de login:** 5 tentativas por minuto por IP. Errar a senha várias vezes na apresentação bloqueia o login por até 1 minuto.
- **Depois de um `git pull`:** pare a API e rode `npx prisma migrate deploy` e `npx prisma generate` em `apps/api`. Sem isso, a API pode continuar na versão antiga ou falhar.
- **Use `npm run dev`:** o `tsc` do front acusa um erro em `reincidencia.tsx:80`, que também deve impedir o `next build` (não executado). A correção está no [backlog](backlog.md).

## Pendências e próximos passos até 27/11/2026

Detalhes e responsáveis estão no [backlog](backlog.md#pendentes-até-27112026).

1. Corrigir o erro de tipo do front.
2. Implementar anexos (RF14) e equipamentos (RF04, RN08).
3. Levar para a tela os filtros que só existem na API (RF11, RF12).
4. Permitir ao administrador ajustar o SLA (RF09).
5. Completar edição de usuário e especialidade do técnico (RF01, RF02).
6. Criar testes automatizados das regras do chamado.

## Como marcar a versão

Depois de revisar e fazer o commit deste pacote, na branch que será entregue:

```bash
git tag -a entrega-06-11-2026 -m "Entrega de 06/11/2026"
git push origin entrega-06-11-2026
```

A tag ainda não foi criada.
