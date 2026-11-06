# Backlog

Tarefas do OSQ-Resolve, com situação em 06/11/2026.

Origem dos responsáveis:

- **Tarefas concluídas:** autor do commit no git. O git registra Lucas como `Dobis` e `Lucas Dobis`.
- **Tarefas com `[A]` ou `[B]`:** marcação da [lista de atividades](atribuicao.md). Lemos `[A]` como Arthur, o que o commit `947e953` confirma, e `[B]` como Bryan.
- **(proposto):** sugestão baseada na área em que cada pessoa já atuou. **A equipe precisa confirmar.**

## Concluídas ou em uso

| Tarefa e requisito | Responsável | Prazo | Situação | Critério de conclusão |
| --- | --- | --- | --- | --- |
| Levantar requisitos e regras de negócio (RF, RNF, RN) | Lucas | 31/07/2026 | Concluída (`de0f936`) | Documentos em `docs/` |
| Descrever o escopo e a equipe | Bryan | 14/08/2026 | Concluída (`7df41c7`) | Arquivo `PROJEO OSQ RESOLVE` |
| Modelagem da Entrega 2 | Maria Fernanda, revisão de Lucas | 08/09/2026 | Concluída (`668988a`, `2b3d208`) | `entrega-2-modelagem.md` com casos de uso, modelos e matriz |
| Autenticação e perfis (RF13, RN09) | Lucas | 24/09/2026 | Concluída (`cb294c2`) | CT01 e CT14 aprovados |
| Abertura e classificação de chamados (RF05, RF06, RF15, RN01, RN02) | Lucas | 24/09/2026 | Concluída sem equipamento (`cb294c2`) | CT03 e CT13 aprovados |
| Atribuição, status e histórico (RF07, RF08, RN03, RN04, RN05, RN06, RN12) | Lucas | 24/09/2026 | Concluída (`cb294c2`) | CT05, CT06 e CT07 aprovados |
| Avaliação (RF10, RN07) | Lucas | 24/09/2026 | Concluída (`cb294c2`) | CT08 aprovado |
| Cancelamento com justificativa (RF16, RN10) | Lucas | 24/09/2026 | Concluída (`cb294c2`) | CT15 aprovado |
| Painel gerencial (RF11, RN14) | Lucas | 24/09/2026 | Concluída sem filtros na tela (`cb294c2`) | CT09 aprovado |
| Revisão visual e calendário do painel | Lucas | 20/10/2026 | Concluída (`336f821`, `465f627`) | Telas em uso |
| Confirmação de saída, transições e tela de login | Lucas | 03/11/2026 | Concluída (`ef1cfed`, `42b1ed8`, `71eeec4`, `4293f07`) | Telas em uso |
| Monitor de SLA (RF09, RN02) `[A]` | Arthur | 06/11/2026 | Concluída (`947e953`) | CT10 aprovado |
| Modo manutenção (RNF03) `[A]` | Arthur | 06/11/2026 | Concluída (`947e953`) | CT11 aprovado |
| Reabertura com causa e reincidência (RN13) `[A]` | Arthur | 06/11/2026 | Concluída (`947e953`) | CT12 aprovado |
| Validar usuário no banco a cada requisição (RNF04) | Lucas | 06/11/2026 | Concluída (`bc4bb55`) | CT17 aprovado |
| Botão Demo apaga só o que gerou (RN11) | Lucas | 06/11/2026 | Concluída (`1598bf7`) | CT18 aprovado |
| Limite de tentativas e bcrypt nativo (RNF04) | Lucas | 06/11/2026 | Concluída (`46341b0`) | CT19 aprovado |

## Pendentes até 27/11/2026

Ordenadas por prioridade.

| Tarefa e requisito | Responsável | Prazo | Situação | Critério de conclusão |
| --- | --- | --- | --- | --- |
| Corrigir erro de tipo em `apps/web/src/components/reincidencia.tsx:80` | Lucas (proposto) | 13/11/2026 | Pendente | `tsc --noEmit` e `next build` sem erro em `apps/web` |
| Revisar este pacote de documentos, repetir os casos e tirar os prints | Equipe | 13/11/2026 | Em revisão | Prints em `docs/testes/evidencias/` e tag `entrega-06-11-2026` criada |
| Anexos no chamado (RF14) | Lucas (proposto) | 27/11/2026 | Pendente, só o modelo existe | CT20 aprovado: enviar e baixar print, log e PDF |
| Equipamentos com histórico (RF04, RN08, RF05) | Maria Fernanda (proposto) | 27/11/2026 | Pendente, só o modelo existe | CT21 aprovado: cadastrar, vincular ao chamado e ver chamados anteriores |
| Filtros na lista: categoria, técnico, setor, solicitante, período (RF12) | Bryan (proposto) | 27/11/2026 | Parcial, só na API | CT04 aprovado também pela tela |
| Filtro de período no painel (RF11) | Arthur (proposto) | 27/11/2026 | Parcial, só na API | CT09 aprovado também pela tela |
| Administrador ajusta o SLA por prioridade (RF09, RN09) | Arthur (proposto) | 27/11/2026 | Pendente, vale o padrão | Prazo novo vale para chamados abertos depois da alteração |
| Editar usuário; especialidade e telefone na tela (RF01, RF02) | Maria Fernanda (proposto) | 27/11/2026 | Parcial | CT02 aprovado sem ressalva |
| Definir se técnico altera chamado de outro técnico (RN09, UC08) | Equipe | 27/11/2026 | Divergência | Regra e código coerentes: a API hoje permite, o UC08 prevê chamado atribuído ao técnico |
| Testes automatizados nas regras do chamado | Maria Fernanda (proposto) | 27/11/2026 | Pendente | Testes rodando por um comando do `package.json` |

## Roteiro de evolução

Ideias da [lista de atividades](atribuicao.md), sem requisito formal. Entram se sobrar tempo depois das pendências.

| Tarefa e requisito | Responsável | Prazo | Situação | Critério de conclusão |
| --- | --- | --- | --- | --- |
| Fila "minha vez" `[B]` | Bryan | A definir | Não iniciada | Técnico vê a própria fila ordenada e pega o próximo chamado |
| Comentários com menção e sino `[B]` | Bryan | A definir | Não iniciada | `@nome` gera aviso não lido para a pessoa citada |
| Relatório exportável `[B]` | Bryan | A definir | Não iniciada | Baixar CSV ou PDF do período pelo painel |
| Base de conhecimento | A definir | A definir | Não iniciada | Abertura sugere artigos parecidos com o título |
| Revisão hierárquica | A definir | A definir | Não iniciada | Chamado de aprendiz passa por um revisor |
