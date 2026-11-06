# Rastreabilidade

Liga cada requisito ao código e ao teste, conforme o estado do commit `9b7d88e` (06/11/2026). A matriz requisito → caso de uso → dados está na [Entrega 2](../entrega-2-osq-resolve/entrega-2-modelagem.md#9-matriz-de-rastreabilidade).

Abreviações de caminho: `api/` = `apps/api/src/`; `web/` = `apps/web/src/`. Testes em [casos de teste](casos-de-teste.md).

Estados:

- **Implementado:** disponível na API e na tela.
- **Parcial:** parte funciona; o que falta está na coluna.
- **Em desenvolvimento:** só o modelo de dados existe.

## Requisitos funcionais

| Requisito | Implementação | Teste | Estado atual |
| --- | --- | --- | --- |
| RF01 Usuários | `api/usuarios/usuarios.module.ts` (`GET`, `POST /usuarios`, `PATCH /usuarios/:id/ativo`); `web/app/(app)/cadastros/page.tsx` | CT02, CT17 | Parcial: não há edição; telefone só na API |
| RF02 Técnicos | Usuário com perfil `TECNICO` e campo `especialidade`, em `api/usuarios/usuarios.module.ts` | CT02 | Parcial: especialidade só na API, sem campo na tela |
| RF03 Setores | `api/setores/setores.module.ts`; `web/app/(app)/cadastros/page.tsx` | CT02, CT17 | Parcial: cria, lista e inativa; não renomeia |
| RF04 Equipamentos | Modelo `Equipamento` em `apps/api/prisma/schema.prisma` | CT21 | Em desenvolvimento: sem rota nem tela |
| RF05 Abertura | `POST /chamados` em `api/chamados/chamados.controller.ts`, `criar` em `chamados.service.ts`; `web/app/(app)/chamados/novo/page.tsx` | CT03, CT13 | Parcial: tudo menos equipamento, que só a API aceita |
| RF06 Categoria | Enum `Categoria`; `api/chamados/chamados.dto.ts`; `web/lib/chamados.ts` | CT03, CT04 | Implementado |
| RF07 Encaminhamento | `PATCH /chamados/:id/atribuir`, `atribuir` em `chamados.service.ts`; seletor em `web/app/(app)/chamados/[id]/page.tsx` | CT05 | Implementado |
| RF08 Histórico | Modelo `HistoricoChamado`; `POST /chamados/:id/followups`; bloco "Histórico" no detalhe do chamado | CT06, CT07 | Implementado |
| RF09 Situação e prazos | `mudarStatus` e `calcularPrazo` em `chamados.service.ts`; `web/lib/sla.ts`, `web/components/sla.tsx` | CT06, CT10 | Parcial: admin não ajusta o SLA, vale o padrão; só o prazo de resolução é usado |
| RF10 Avaliação | `POST /chamados/:id/avaliacao`, `avaliar` em `chamados.service.ts`; bloco "Avaliação" no detalhe do chamado | CT08 | Implementado |
| RF11 Painel | `api/dashboard/dashboard.module.ts`; `web/app/(app)/dashboard/page.tsx` | CT09 | Parcial: a API filtra por período; a tela só escolhe o ano do primeiro gráfico |
| RF12 Consulta | `GET /chamados`, `listar` em `chamados.service.ts`; `web/app/(app)/chamados/page.tsx` | CT04 | Parcial: a API tem todos os filtros; a tela só tem busca, status e prioridade |
| RF13 Acesso | `api/auth/`, `api/common/auth.ts` (`JwtAuthGuard`, `RolesGuard`); `web/app/(auth)/login/page.tsx`, `web/lib/auth.tsx` | CT01, CT14, CT19 | Implementado |
| RF14 Anexos | Modelo `Anexo`; `buscar` em `chamados.service.ts` só devolve a lista | CT20 | Em desenvolvimento: sem envio nem tela |
| RF15 Prioridade | Enum `Prioridade`; `SLA_PADRAO` em `api/auth/auth.service.ts`; `web/lib/chamados.ts` | CT03, CT04 | Implementado |
| RF16 Cancelamento | `mudarStatus` em `chamados.service.ts`; botão "Cancelar" no detalhe do chamado | CT15 | Implementado |

## Regras de negócio

| Regra | Implementação | Teste | Estado atual |
| --- | --- | --- | --- |
| RN01 Abertura | `CriarChamadoDto`; `criar` em `chamados.service.ts` | CT03, CT13 | Implementado |
| RN02 SLA | `calcularPrazo` em `chamados.service.ts`; modelo `Sla` | CT03, CT10 | Parcial: só o prazo de resolução |
| RN03 Atribuição | `mudarStatus` recusa início sem técnico | CT05 | Implementado |
| RN04 Status | Constante `TRANSICOES` em `chamados.service.ts`; `PROXIMOS` no detalhe do chamado | CT06 | Implementado |
| RN05 Histórico | `historico.create` nas operações de `chamados.service.ts` | CT03, CT05, CT06 | Implementado |
| RN06 Fechamento | `TRANSICOES` e `garantirEditavel` em `chamados.service.ts` | CT12 | Implementado |
| RN07 Avaliação | `avaliar` em `chamados.service.ts` | CT08 | Implementado |
| RN08 Equipamento | Validação em `criar`, `chamados.service.ts` | CT21 | Parcial: a regra existe, mas não dá para cadastrar equipamento |
| RN09 Perfis | `@Roles` nos controllers; `equipe` em `chamados.service.ts`; `NAV` em `web/components/app-shell.tsx` | CT14 | Parcial: admin não gerencia SLA; painel também aberto a técnico; técnico altera chamado de outro técnico |
| RN10 Cancelamento | `TRANSICOES` e justificativa em `mudarStatus` | CT15 | Implementado |
| RN11 Exclusão | `alternarAtivo` em `api/setores/setores.module.ts`; `removerDemo` não apaga setores | CT17, CT18 | Parcial: vale para setor; equipamento ainda não existe |
| RN12 Follow-ups internos | `buscar` e `followUp` em `chamados.service.ts` | CT07 | Implementado |
| RN13 Reabertura | `reabrir` em `chamados.service.ts`; `ReabrirDto`; `api/reincidencia/reincidencia.module.ts`; `web/components/reincidencia.tsx` | CT12 | Implementado |
| RN14 Indicadores | `concluidos` em `api/dashboard/dashboard.module.ts` | CT09 | Implementado |

## Requisitos não funcionais

| Requisito | Implementação | Teste | Estado atual |
| --- | --- | --- | --- |
| RNF01 Usabilidade | Tailwind, `web/hooks/use-mobile.ts` | Sem caso formal | Parcial: a tela de celular não foi testada nesta entrega |
| RNF02 Desempenho | Índices no `schema.prisma`; lista limitada a 300 | Sem caso formal | Não medido |
| RNF03 Disponibilidade | `api/manutencao/manutencao.module.ts`; `web/components/manutencao.tsx` | CT11 | Parcial: há modo manutenção; não há implantação |
| RNF04 Segurança | JWT, bcrypt, `ThrottlerGuard` em `api/auth/auth.controller.ts`, `RolesGuard` | CT01, CT14, CT17, CT19 | Implementado |
| RNF05 Integridade | Chaves estrangeiras no `schema.prisma`; validação de vínculos no service | CT03, CT05 | Implementado |
| RNF06 Auditoria | `HistoricoChamado` | CT06, CT12 | Parcial: cobre o chamado; cadastros não têm histórico |
| RNF07 Escalabilidade | Separação web/API/banco | Sem caso formal | Não medido |
| RNF08 Multitenancy | `organizacaoId` nas consultas | CT11, CT16 | Implementado |
| RNF09 Confiabilidade | `$transaction` no cadastro e em `removerDemo` | Sem caso formal | Parcial |
| RNF10 Observabilidade | Log padrão do NestJS | Sem caso formal | Parcial: sem logs de eventos próprios |

## Funcionalidades fora da lista de requisitos

| Funcionalidade | Implementação | Teste | Ligação |
| --- | --- | --- | --- |
| Indicador de reincidência | `api/reincidencia/reincidencia.module.ts`; `web/components/reincidencia.tsx` | CT12 | Apoia RF11 e RN13 |
| Botão Demo | `seedDemo` e `removerDemo` em `chamados.service.ts`; `DemoButton` em `web/components/app-shell.tsx` | CT18 | Apoio à demonstração |
