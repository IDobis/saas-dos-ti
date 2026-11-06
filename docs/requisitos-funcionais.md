# Requisitos funcionais

| ID | Requisito | Descrição |
| --- | --- | --- |
| RF01 | Usuários | Criar, editar, listar e inativar solicitantes (identificação, contato, setor). |
| RF02 | Técnicos | Cadastrar técnicos com especialidade e vínculo ao atendimento. |
| RF03 | Setores | Gerenciar setores/departamentos da organização. |
| RF04 | Equipamentos | Registrar ativos e vinculá-los a setor e/ou usuário. |
| RF05 | Abertura de chamados | Registrar chamado com título, descrição, categoria, prioridade, setor e equipamento (opcional). |
| RF06 | Classificação por categoria | Categoria (hardware, software, rede, acesso, outros). |
| RF07 | Encaminhamento | Atribuir ou reatribuir o chamado a um técnico. |
| RF08 | Histórico | Registrar alterações e follow-ups com data, hora e autor. |
| RF09 | Situação e prazos | Controlar status do chamado e SLA conforme a prioridade. |
| RF10 | Avaliação | Solicitante avalia o atendimento após resolução/fechamento. |
| RF11 | Painel | Quantidade de chamados e tempo médio de resolução, com filtros. |
| RF12 | Consulta | Listar e filtrar chamados por status, prioridade, categoria, técnico, setor, solicitante e período. |
| RF13 | Acesso | Autenticação e permissões por perfil (solicitante, técnico, administrador). |
| RF14 | Anexos | Anexar arquivos ao chamado (prints, logs, documentos). |
| RF15 | Classificação por prioridade | Prioridade (baixa, média, alta, crítica). |
| RF16 | Cancelamento de chamados | Permitir que o solicitante cancele o próprio chamado, ou que a equipe de TI cancele qualquer chamado, antes de resolvido/fechado, mediante justificativa (RN10). |

O estado de implementação de cada requisito está em [rastreabilidade](rastreabilidade.md).

## Histórico de alterações

| Data | Alteração | Motivo |
| --- | --- | --- |
| 06/11/2026 | RF06 passa a tratar só de categoria, e inclui "outros". Criados RF15 (prioridade) e RF16 (cancelamento) | A Entrega 2 já usava RF15 e RF16, mas esta lista parava em RF14. As duas funções existem no código, então o caminho seguro é alinhar a lista, sem remover requisitos da Entrega 2 |
| 06/11/2026 | RF16 inclui também a equipe de TI, além do solicitante previsto na Entrega 2 | É o que o código e o diagrama de casos de uso fazem. O documento da Entrega 2 foi mantido como registro do que foi entregue |
