# Regras de negócio

| ID | Regra | Descrição |
| --- | --- | --- |
| RN01 | Abertura | Chamado exige solicitante, título, descrição, categoria, prioridade; status inicial **Aberto**. |
| RN02 | SLA | Prazo de atendimento/resolução definido pela prioridade. |
| RN03 | Atribuição | Atendimento só inicia com técnico responsável. |
| RN04 | Status | Transições válidas (ex.: Aberto → Em andamento → Aguardando → Resolvido → Fechado). |
| RN05 | Histórico | Toda alteração relevante gera registro automático. |
| RN06 | Fechamento | Só fecha chamado resolvido; fechado não edita (exceto reabertura autorizada). |
| RN07 | Avaliação | Apenas o solicitante, após resolvido ou fechado. |
| RN08 | Equipamento | Se informado, deve pertencer ao setor/usuário do chamado. |
| RN09 | Perfis | Solicitante abre/acompanha; técnico atende; admin gerencia cadastros, SLA e painel. |
| RN10 | Cancelamento | Só antes de resolvido/fechado, com justificativa. |
| RN11 | Exclusão | Setor/equipamento com chamados vinculados não exclui — apenas inativa. |
| RN12 | Follow-ups internos | Visíveis só a técnicos e administradores. |
| RN13 | Reabertura | Técnico ou admin; gera histórico e reaplica política de prazo. |
| RN14 | Indicadores | Volume e tempo médio consideram apenas chamados concluídos no filtro. |
