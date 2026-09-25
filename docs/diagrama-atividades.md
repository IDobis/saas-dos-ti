# Diagramas de atividades

Os dois fluxos centrais do chamado, mais a máquina de estados que a API realmente aceita.

## Abrir chamado

```mermaid
flowchart TD
  inicio([Início]) --> form[Informar título, descrição, categoria, prioridade e setor]
  form --> eq{Informou equipamento?}
  eq -->|Não| campos{Dados obrigatórios válidos?}
  eq -->|Sim| dono{Equipamento é do setor ou do solicitante?}
  dono -->|Não| erroEq[Recusar o equipamento]
  erroEq --> form
  dono -->|Sim| campos
  campos -->|Não| erro[Exibir o erro e manter o formulário]
  erro --> form
  campos -->|Sim| sla[Calcular o prazo pelo SLA da prioridade]
  sla --> gravar[Gravar o chamado com status Aberto]
  gravar --> hist[Registrar histórico de criação]
  hist --> fim([Fim])
```

## Atender, resolver ou reabrir

```mermaid
flowchart TD
  inicio([Chamado aberto]) --> passo{Ação da equipe}
  passo -->|Atribuir| atribuir[Registrar o técnico responsável]
  atribuir --> histA[Histórico de atribuição]
  histA --> passo
  passo -->|Iniciar| temTec{Há técnico atribuído?}
  temTec -->|Não| recusa[Recusar o início]
  recusa --> passo
  temTec -->|Sim| andamento[Em andamento]
  andamento --> meio{Durante o atendimento}
  meio -->|Aguardar| aguardando[Aguardando]
  aguardando --> retomada{Retomar, resolver ou cancelar?}
  retomada -->|Retomar| andamento
  meio -->|Resolver| resolvido[Resolvido]
  retomada -->|Resolver| resolvido
  meio -->|Cancelar| just{Há justificativa?}
  retomada -->|Cancelar| just
  passo -->|Cancelar ainda aberto| just
  just -->|Não| recusaC[Recusar o cancelamento]
  recusaC --> passo
  just -->|Sim| cancelado([Cancelado])
  resolvido --> depois{Depois da resolução}
  depois -->|Fechar| fechado[Fechado]
  depois -->|Reabrir| reabre[Em andamento, com prazo novo]
  depois -->|Avaliar| avalia{É o solicitante?}
  fechado --> depoisFechado{Depois do fechamento}
  depoisFechado -->|Reabrir| reabre
  depoisFechado -->|Avaliar| avalia
  reabre --> andamento
  avalia -->|Sim| nota[Registrar nota de 1 a 5]
  avalia -->|Não| semNota[Avaliação indisponível]
  nota --> fim([Fim])
  semNota --> fim
```

Cada mudança de status, a atribuição, o cancelamento, o follow-up e a reabertura gravam histórico.

## Estados do chamado

O fluxo antigo descrevia uma fila única: Aberto, Em andamento, Aguardando, Resolvido, Fechado. A API aceita os desvios abaixo. Cancelado não reabre. Reabrir sai de Resolvido ou Fechado e volta para Em andamento.

```mermaid
stateDiagram-v2
  [*] --> Aberto: abertura
  Aberto --> EmAndamento: iniciar com técnico
  Aberto --> Cancelado: cancelar com justificativa
  EmAndamento --> Aguardando
  EmAndamento --> Resolvido
  EmAndamento --> Cancelado: cancelar com justificativa
  Aguardando --> EmAndamento
  Aguardando --> Resolvido
  Aguardando --> Cancelado: cancelar com justificativa
  Resolvido --> Fechado
  Resolvido --> EmAndamento: reabrir
  Fechado --> EmAndamento: reabrir
  Cancelado --> [*]
  Fechado --> [*]
```
