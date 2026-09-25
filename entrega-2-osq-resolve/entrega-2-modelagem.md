# Entrega 2
---

## 1. Escopo do sistema

O OSQ Resolve é uma plataforma destinada a equipes de suporte de tecnologia de empresas e instituições. O sistema permite cadastrar usuários, técnicos, setores e equipamentos, e abrir chamados relacionados a problemas de computadores, sistemas e rede. Os chamados são classificados por categoria e prioridade, encaminhados aos técnicos responsáveis e acompanhados por meio de histórico, prazos e situação. Ao final do atendimento, o solicitante avalia o serviço prestado, e um painel gerencial apresenta a quantidade de chamados e o tempo médio de resolução.

Esta entrega parte da versão consolidada dos requisitos funcionais (RF), não funcionais (RNF) e regras de negócio (RN) do Documento de Visão e Requisitos (Entrega 1) e acrescenta os modelos de comportamento e de dados do sistema, mantendo a rastreabilidade entre requisito → caso de uso → processo → dados → futura tela.

---

## 2. Histórico de alterações em relação à Entrega 1

A partir da devolutiva da Entrega 1, dada pela professora em aula, a equipe revisou dois pontos do documento: a concordância textual/gramatical e a redação dos requisitos funcionais. Na revisão dos requisitos, identificou-se que o RF06 reunia duas classificações distintas (categoria e prioridade) em um único requisito, e que faltava um requisito funcional específico para o cancelamento de chamados — ação já prevista na regra de negócio RN10, mas sem um RF correspondente. As correções abaixo foram aplicadas.

| Item | Alteração | Motivo |
|---|---|---|
| RF06 | Separado em RF06 e RF15 | O requisito reunia duas classificações distintas (categoria e prioridade) |
| RF15 (novo) | Criado "Classificação por prioridade: baixa, média, alta, crítica" | Desmembrado do RF06 original |
| RF16 (novo) | Incluído "Cancelamento de chamados: permitir que o solicitante cancele um chamado antes de resolvido/fechado, mediante justificativa" | RN10 já previa a regra, mas não havia requisito funcional correspondente |
| Concordância | Revisão de concordância textual/gramatical ao longo do Documento de Visão e Requisitos | Apontado na devolutiva da professora |
---

## 3. Diagrama de casos de uso

O diagrama representa os três perfis definidos em RN09 — Solicitante, Técnico e Administrador — e as funcionalidades do sistema. `include` marca o que sempre ocorre junto. `extend` marca o que é opcional. A versão em Mermaid, alinhada ao que a API faz, está em [diagrama de casos de uso](../docs/diagrama-casos-de-uso.md).

---

## 4. Especificação dos casos de uso

Foram selecionados cinco casos de uso prioritários, cobrindo os três perfis de ator e o ciclo de vida do chamado.

### UC02 – Abrir chamado

| | |
|---|---|
| **Ator principal** | Solicitante |
| **Requisito relacionado** | RF05, RF06, RF15, RF14 / RN01, RN02 |
| **Objetivo** | Registrar um novo chamado de suporte técnico. |
| **Pré-condições** | Solicitante autenticado no sistema (RF13). |
| **Fluxo principal** | 1. Solicitante seleciona a opção "Abrir chamado". <br> 2. Informa título, descrição, categoria e prioridade. <br> 3. Seleciona o setor e, opcionalmente, o equipamento relacionado. <br> 4. Anexa arquivos, se necessário (RF14). <br> 5. Sistema valida os dados obrigatórios (RN01) e registra o chamado com status "Aberto", aplicando o prazo de SLA da prioridade escolhida (RN02). |
| **Fluxo alternativo** | 3A. Dados obrigatórios ausentes ou inválidos: sistema exibe mensagem de erro e mantém os dados já preenchidos para correção. |
| **Pós-condição** | Chamado registrado com status "Aberto"; registro automático gerado no histórico (RN05). |

### UC07 – Encaminhar / reatribuir chamado

| | |
|---|---|
| **Ator principal** | Administrador (ou técnico com permissão de triagem) |
| **Requisito relacionado** | RF07 / RN03, RN04, RN05 |
| **Objetivo** | Atribuir um chamado aberto a um técnico responsável, ou reatribuí-lo a outro técnico. |
| **Pré-condições** | Chamado registrado; ator autenticado com perfil compatível (RN09). |
| **Fluxo principal** | 1. Ator consulta a lista de chamados sem técnico responsável (ou já atribuídos, no caso de reatribuição). <br> 2. Seleciona o chamado desejado. <br> 3. Escolhe o técnico responsável, considerando especialidade e carga de trabalho. <br> 4. Sistema associa o técnico ao chamado (RN03) e registra a alteração no histórico (RN05). |
| **Fluxo alternativo** | 3A. Nenhum técnico disponível para a especialidade exigida: sistema alerta o ator, que pode manter o chamado sem técnico até nova tentativa. |
| **Pós-condição** | Chamado associado a um técnico responsável; histórico atualizado. |

### UC08 – Atualizar status do chamado

| | |
|---|---|
| **Ator principal** | Técnico |
| **Requisito relacionado** | RF09 / RN04, RN05, RN06 |
| **Objetivo** | Alterar a situação do chamado conforme o andamento do atendimento. |
| **Pré-condições** | Chamado atribuído ao técnico (RN03). |
| **Fluxo principal** | 1. Técnico abre o chamado sob sua responsabilidade. <br> 2. Seleciona a nova situação, respeitando as transições válidas: Aberto → Em andamento → Aguardando → Resolvido → Fechado (RN04). <br> 3. Registra observação (follow-up) sobre a mudança. <br> 4. Sistema grava a nova situação e gera registro automático no histórico (RN05). |
| **Fluxo alternativo** | 2A. Técnico tenta uma transição de status inválida (ex.: Aberto → Fechado diretamente): sistema recusa a operação e informa as transições permitidas (RN04, RN06). |
| **Pós-condição** | Chamado com novo status registrado; histórico atualizado. |

### UC05 – Avaliar atendimento

| | |
|---|---|
| **Ator principal** | Solicitante |
| **Requisito relacionado** | RF10 / RN07 |
| **Objetivo** | Registrar a avaliação do atendimento recebido em um chamado. |
| **Pré-condições** | Chamado com status "Resolvido" ou "Fechado"; avaliação realizada apenas pelo próprio solicitante (RN07). |
| **Fluxo principal** | 1. Solicitante acessa o chamado resolvido/fechado. <br> 2. Sistema exibe a opção de avaliação. <br> 3. Solicitante atribui uma nota e, opcionalmente, um comentário. <br> 4. Sistema registra a avaliação vinculada ao chamado. |
| **Fluxo alternativo** | 1A. Chamado ainda não resolvido/fechado, ou solicitante diferente do autor do chamado: sistema não disponibiliza a opção de avaliação (RN07). |
| **Pós-condição** | Avaliação registrada e disponível para os indicadores gerenciais. |

### UC14 – Consultar painel gerencial

| | |
|---|---|
| **Ator principal** | Administrador |
| **Requisito relacionado** | RF11 / RN14 |
| **Objetivo** | Visualizar indicadores de volume de chamados e tempo médio de resolução. |
| **Pré-condições** | Administrador autenticado (RN09). |
| **Fluxo principal** | 1. Administrador acessa o painel gerencial. <br> 2. Define filtros de período, setor, categoria, prioridade ou técnico. <br> 3. Sistema calcula a quantidade de chamados e o tempo médio de resolução considerando apenas os chamados concluídos no filtro (RN14). <br> 4. Sistema exibe os indicadores resultantes. |
| **Fluxo alternativo** | 3A. Nenhum chamado concluído no período filtrado: sistema exibe indicadores zerados com aviso de ausência de dados. |
| **Pós-condição** | Indicadores exibidos conforme os filtros selecionados. |

---

## 5. Diagramas de atividades

Foram modelados os dois processos centrais do sistema: a abertura de um chamado e o ciclo de atendimento até a resolução (ou reabertura).

### 5.1 Abrir chamado

O fluxo de abertura, o de atendimento e a máquina de estados estão em [diagramas de atividades](../docs/diagrama-atividades.md).

### 5.2 Atender e resolver chamado

O atendimento não é uma fila única até o fechamento. O chamado pode ir para aguardando, ser resolvido sem passar por aguardando, ser cancelado com justificativa ou ser reaberto a partir de resolvido ou fechado. O desenho corrigido está no mesmo arquivo de atividades.

---

## 6. Modelo conceitual do banco de dados

O modelo conceitual implementado está em [modelo conceitual](../docs/modelo-conceitual.md). O diagrama de classes correspondente está em [diagrama de classes](../docs/diagrama-de-classes.md).

**Leitura dos principais relacionamentos:**

- A organização agrupa setores, usuários, equipamentos, chamados e a configuração de SLA.
- Setor do usuário e do equipamento é opcional. Todo chamado pertence a um setor.
- Técnico não é uma entidade separada. É um usuário com perfil técnico e especialidade opcional. Esse usuário abre chamados como solicitante e pode atender chamados como responsável.
- Categoria, prioridade, status e tipo de histórico são enumerações. O chamado pode referenciar um equipamento e gera histórico. A avaliação é no máximo uma, feita pelo solicitante.

---

## 7. Modelo lógico do banco de dados

As entidades do modelo conceitual foram transformadas em tabelas, com chaves primárias (PK), chaves estrangeiras (FK), tipos de dados e restrições.

### 7.1 usuario

| Campo | Tipo | Chave | Observação |
|---|---|---|---|
| id_usuario | INT | PK | Identificador único |
| nome | VARCHAR(120) | — | Obrigatório |
| email | VARCHAR(150) | — | Obrigatório, único; usado no login |
| senha_hash | VARCHAR(255) | — | Obrigatório; armazenado com hash (RNF04) |
| perfil | VARCHAR(20) | — | Obrigatório; solicitante \| tecnico \| administrador (RN09) |
| id_setor | INT | FK | Referencia setor.id_setor |
| ativo | BOOLEAN | — | Obrigatório; suporta inativação (RN11) em vez de exclusão |

### 7.2 tecnico

| Campo | Tipo | Chave | Observação |
|---|---|---|---|
| id_tecnico | INT | PK, FK | Referencia usuario.id_usuario (especialização 1:1) |
| especialidade | VARCHAR(80) | — | Obrigatório; usada na atribuição de chamados |

### 7.3 setor

| Campo | Tipo | Chave | Observação |
|---|---|---|---|
| id_setor | INT | PK | Identificador único |
| nome | VARCHAR(100) | — | Obrigatório, único |
| ativo | BOOLEAN | — | Obrigatório; suporta inativação (RN11) |

### 7.4 equipamento

| Campo | Tipo | Chave | Observação |
|---|---|---|---|
| id_equipamento | INT | PK | Identificador único |
| nome | VARCHAR(120) | — | Obrigatório |
| tipo | VARCHAR(50) | — | Ex.: computador, impressora, servidor |
| id_setor | INT | FK | Referencia setor.id_setor |
| id_usuario | INT | FK | Referencia usuario.id_usuario; opcional (RN08) |
| ativo | BOOLEAN | — | Obrigatório; suporta inativação (RN11) |

### 7.5 categoria

| Campo | Tipo | Chave | Observação |
|---|---|---|---|
| id_categoria | INT | PK | Identificador único |
| nome | VARCHAR(50) | — | Obrigatório; ex.: hardware, software, rede, acesso |

### 7.6 prioridade

| Campo | Tipo | Chave | Observação |
|---|---|---|---|
| id_prioridade | INT | PK | Identificador único |
| nome | VARCHAR(20) | — | Obrigatório; baixa, média, alta, crítica |
| prazo_atendimento_h | INT | — | Prazo de SLA para início do atendimento, em horas (RN02) |
| prazo_resolucao_h | INT | — | Prazo de SLA para resolução, em horas (RN02) |

### 7.7 chamado

| Campo | Tipo | Chave | Observação |
|---|---|---|---|
| id_chamado | INT | PK | Identificador único |
| titulo | VARCHAR(150) | — | Obrigatório (RN01) |
| descricao | TEXT | — | Obrigatório (RN01) |
| id_solicitante | INT | FK | Referencia usuario.id_usuario |
| id_tecnico | INT | FK | Referencia usuario.id_usuario (técnico); nulo até atribuição (RN03) |
| id_setor | INT | FK | Referencia setor.id_setor |
| id_categoria | INT | FK | Referencia categoria.id_categoria |
| id_prioridade | INT | FK | Referencia prioridade.id_prioridade |
| id_equipamento | INT | FK | Referencia equipamento.id_equipamento; opcional (RN08) |
| status | VARCHAR(20) | — | Aberto \| Em andamento \| Aguardando \| Resolvido \| Fechado \| Cancelado (RN04) |
| data_abertura | DATETIME | — | Obrigatório; preenchida na criação |
| data_atendimento | DATETIME | — | Preenchida ao iniciar o atendimento |
| data_resolucao | DATETIME | — | Preenchida ao resolver o chamado |
| data_fechamento | DATETIME | — | Preenchida ao fechar o chamado (RN06) |

### 7.8 historico

| Campo | Tipo | Chave | Observação |
|---|---|---|---|
| id_historico | INT | PK | Identificador único |
| id_chamado | INT | FK | Referencia chamado.id_chamado |
| id_usuario_autor | INT | FK | Referencia usuario.id_usuario |
| data_hora | DATETIME | — | Obrigatório; gerado automaticamente (RN05) |
| tipo | VARCHAR(30) | — | alteracao \| follow_up |
| descricao | TEXT | — | Obrigatório |
| visivel_solicitante | BOOLEAN | — | Controla exibição de follow-ups internos ao solicitante (RN12) |

### 7.9 avaliacao

| Campo | Tipo | Chave | Observação |
|---|---|---|---|
| id_avaliacao | INT | PK | Identificador único |
| id_chamado | INT | FK | Referencia chamado.id_chamado; relacionamento 1:1 |
| nota | INT | — | Obrigatório; escala de 1 a 5 |
| comentario | TEXT | — | Opcional |
| data | DATETIME | — | Obrigatório |

### 7.10 anexo

| Campo | Tipo | Chave | Observação |
|---|---|---|---|
| id_anexo | INT | PK | Identificador único |
| id_chamado | INT | FK | Referencia chamado.id_chamado |
| nome_arquivo | VARCHAR(200) | — | Obrigatório |
| caminho | VARCHAR(255) | — | Obrigatório; local de armazenamento do arquivo |
| id_usuario_autor | INT | FK | Referencia usuario.id_usuario |
| data_upload | DATETIME | — | Obrigatório |

---

## 8. Dicionário de dados

O dicionário detalha tamanho e obrigatoriedade de cada campo, de forma coerente com o modelo lógico apresentado na seção anterior.

| Tabela | Campo | Tipo | Tam. | Obrig. | Chave | Descrição |
|---|---|---|---|---|---|---|
| usuario | id_usuario | INT | — | Sim | PK | Identificador único do usuário |
| usuario | nome | VARCHAR | 120 | Sim | — | Nome completo |
| usuario | email | VARCHAR | 150 | Sim | — | E-mail, usado como login; único |
| usuario | perfil | VARCHAR | 20 | Sim | — | Solicitante, técnico ou administrador |
| usuario | id_setor | INT | — | Sim | FK | Setor ao qual o usuário pertence |
| usuario | ativo | BOOLEAN | — | Sim | — | Indica se o cadastro está ativo |
| tecnico | id_tecnico | INT | — | Sim | PK/FK | Usuário com perfil técnico |
| tecnico | especialidade | VARCHAR | 80 | Sim | — | Área de especialidade do técnico |
| setor | id_setor | INT | — | Sim | PK | Identificador único do setor |
| setor | nome | VARCHAR | 100 | Sim | — | Nome do setor/departamento |
| equipamento | id_equipamento | INT | — | Sim | PK | Identificador único do equipamento |
| equipamento | tipo | VARCHAR | 50 | Sim | — | Tipo do ativo de TI |
| equipamento | id_setor | INT | — | Sim | FK | Setor ao qual o equipamento pertence |
| equipamento | id_usuario | INT | — | Não | FK | Usuário vinculado ao equipamento (RN08) |
| categoria | id_categoria | INT | — | Sim | PK | Identificador único da categoria |
| categoria | nome | VARCHAR | 50 | Sim | — | Hardware, software, rede ou acesso |
| prioridade | id_prioridade | INT | — | Sim | PK | Identificador único da prioridade |
| prioridade | prazo_atendimento_h | INT | — | Sim | — | Prazo de SLA para atendimento (RN02) |
| prioridade | prazo_resolucao_h | INT | — | Sim | — | Prazo de SLA para resolução (RN02) |
| chamado | id_chamado | INT | — | Sim | PK | Identificador único do chamado |
| chamado | titulo | VARCHAR | 150 | Sim | — | Título resumido do chamado (RN01) |
| chamado | descricao | TEXT | — | Sim | — | Detalhamento do problema (RN01) |
| chamado | id_solicitante | INT | — | Sim | FK | Usuário que abriu o chamado |
| chamado | id_tecnico | INT | — | Não | FK | Técnico responsável (RN03) |
| chamado | status | VARCHAR | 20 | Sim | — | Situação atual (RN04) |
| historico | id_historico | INT | — | Sim | PK | Identificador único do registro |
| historico | id_chamado | INT | — | Sim | FK | Chamado ao qual o registro pertence |
| historico | visivel_solicitante | BOOLEAN | — | Sim | — | Oculta follow-ups internos do solicitante (RN12) |
| avaliacao | id_avaliacao | INT | — | Sim | PK | Identificador único da avaliação |
| avaliacao | id_chamado | INT | — | Sim | FK | Chamado avaliado (RN07) |
| avaliacao | nota | INT | — | Sim | — | Nota de 1 a 5 atribuída pelo solicitante |
| anexo | id_anexo | INT | — | Sim | PK | Identificador único do anexo |
| anexo | id_chamado | INT | — | Sim | FK | Chamado ao qual o anexo pertence |
| anexo | nome_arquivo | VARCHAR | 200 | Sim | — | Nome original do arquivo enviado |

---

## 9. Matriz de rastreabilidade

A matriz conecta cada requisito funcional ao caso de uso correspondente, às entidades de dados envolvidas e à tela prevista, evidenciando que os artefatos foram produzidos de forma integrada.

| Requisito | Caso de uso | Entidades envolvidas | Tela prevista |
|---|---|---|---|
| RF01 – Usuários | Gerenciar usuários | USUARIO, SETOR | Usuários |
| RF02 – Técnicos | Gerenciar técnicos | USUARIO, TECNICO | Técnicos |
| RF03 – Setores | Gerenciar setores | SETOR | Setores |
| RF04 – Equipamentos | Gerenciar equipamentos | EQUIPAMENTO, SETOR, USUARIO | Equipamentos |
| RF05 – Abertura de chamados | UC02 – Abrir chamado | CHAMADO, USUARIO, SETOR, CATEGORIA, PRIORIDADE, EQUIPAMENTO | Novo chamado |
| RF06 – Classificação por categoria | UC02 – Abrir chamado (parte) | CATEGORIA, CHAMADO | Novo chamado / Detalhes do chamado |
| RF15 – Classificação por prioridade | UC02 – Abrir chamado (parte) | PRIORIDADE, CHAMADO | Novo chamado / Detalhes do chamado |
| RF07 – Encaminhamento | UC07 – Encaminhar/reatribuir chamado | CHAMADO, USUARIO (TECNICO), HISTORICO | Detalhes do chamado |
| RF08 – Histórico | Registrar histórico | HISTORICO, CHAMADO, USUARIO | Histórico do chamado |
| RF09 – Situação e prazos | UC08 – Atualizar status do chamado | CHAMADO, PRIORIDADE, HISTORICO | Detalhes do chamado |
| RF10 – Avaliação | UC05 – Avaliar atendimento | AVALIACAO, CHAMADO | Avaliação do atendimento |
| RF11 – Painel | UC14 – Consultar painel gerencial | CHAMADO | Painel gerencial |
| RF12 – Consulta | Consultar chamados | CHAMADO, USUARIO, SETOR, CATEGORIA, PRIORIDADE | Lista de chamados |
| RF13 – Acesso | Autenticar-se | USUARIO | Login |
| RF14 – Anexos | Anexar arquivo | ANEXO, CHAMADO | Detalhes do chamado |
| RF16 – Cancelamento de chamados | UC10 – Cancelar chamado | CHAMADO, HISTORICO | Detalhes do chamado |
---

## 10. Revisão cruzada dos modelos

- Todo caso de uso relevante tem origem em um requisito funcional (ver matriz da seção 9).
- Os nomes de entidades, status e perfis usados nos diagramas correspondem aos nomes usados nas seções de requisitos (RF, RN).
- As entidades necessárias aos processos modelados (autenticação, abertura, atendimento, avaliação) aparecem no modelo de dados.
- As chaves estrangeiras do modelo lógico refletem os relacionamentos definidos no modelo conceitual (setor, categoria, prioridade, equipamento e técnico em relação a chamado).
- Os fluxos de atividades respeitam as regras de negócio de transição de status (RN04), atribuição (RN03), fechamento (RN06) e reabertura (RN13).
- É possível explicar o caminho requisito → caso de uso → processo → dados → futura tela para todos os RF, conforme demonstrado na matriz de rastreabilidade.
