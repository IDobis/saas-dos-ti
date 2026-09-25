# Diagrama de casos de uso

Atores da RN09 e casos de uso que o sistema implementa. `include` é passo obrigatório. `extend` é passo opcional.

```mermaid
flowchart TB
  solicitante((Solicitante))
  tecnico((Técnico))
  admin((Administrador))

  subgraph osq [OSQ-Resolve]
    autenticar([Autenticar-se])
    abrir([Abrir chamado])
    consultar([Consultar chamados])
    atribuir([Atribuir chamado])
    status([Atualizar status])
    cancelar([Cancelar chamado])
    follow([Registrar follow-up])
    reabrir([Reabrir chamado])
    avaliar([Avaliar atendimento])
    painel([Consultar painel])
    cadastros([Gerenciar cadastros])
    historico([Registrar histórico])
    anexar([Anexar arquivo])
  end

  solicitante --> autenticar
  solicitante --> abrir
  solicitante --> consultar
  solicitante --> cancelar
  solicitante --> follow
  solicitante --> avaliar

  tecnico --> autenticar
  tecnico --> abrir
  tecnico --> consultar
  tecnico --> atribuir
  tecnico --> status
  tecnico --> cancelar
  tecnico --> follow
  tecnico --> reabrir
  tecnico --> painel

  admin --> autenticar
  admin --> abrir
  admin --> consultar
  admin --> atribuir
  admin --> status
  admin --> cancelar
  admin --> follow
  admin --> reabrir
  admin --> painel
  admin --> cadastros

  abrir -.->|include| autenticar
  abrir -.->|include| historico
  abrir -.->|extend| anexar
  atribuir -.->|include| historico
  status -.->|include| historico
  cancelar -.->|include| historico
  follow -.->|include| historico
  reabrir -.->|include| historico
```

## Leitura

- Qualquer usuário autenticado abre chamado em nome próprio. O solicitante só consulta os próprios.
- Atribuir, mudar status da equipe, reabrir e o painel são do técnico e do administrador. Cadastros ficam só com o administrador.
- O solicitante altera status apenas para cancelar o próprio chamado, com justificativa, antes de resolvido ou fechado.
- Follow-up interno só aparece para técnico e administrador.
- Avaliação é só do solicitante, e só com o chamado resolvido ou fechado.
- Anexar arquivo está no modelo e no requisito, como extensão opcional da abertura. Ainda não existe rota de upload.
