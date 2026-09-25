# Diagrama de classes

Modelo de domínio do OSQ-Resolve, como está em `apps/api/prisma/schema.prisma`. Técnico não é uma classe à parte: é um `Usuario` com perfil `TECNICO` e especialidade opcional. Categoria, prioridade, status e tipo de histórico são enumerações.

```mermaid
classDiagram
    direction TB

    class Organizacao {
        +id : UUID
        +nome : String
        +ativa : Boolean
        +criadoEm : DateTime
    }

    class Setor {
        +id : UUID
        +organizacaoId : UUID
        +nome : String
        +ativo : Boolean
    }

    class Usuario {
        +id : UUID
        +organizacaoId : UUID
        +setorId : UUID
        +nome : String
        +email : String
        +telefone : String
        +senhaHash : String
        +perfil : Perfil
        +especialidade : String
        +ativo : Boolean
        +criadoEm : DateTime
    }

    class Equipamento {
        +id : UUID
        +organizacaoId : UUID
        +setorId : UUID
        +usuarioId : UUID
        +nome : String
        +patrimonio : String
        +tipo : String
        +ativo : Boolean
    }

    class Sla {
        +id : UUID
        +organizacaoId : UUID
        +prioridade : Prioridade
        +minutosAtendimento : Int
        +minutosResolucao : Int
    }

    class Chamado {
        +id : UUID
        +numero : Int
        +organizacaoId : UUID
        +solicitanteId : UUID
        +tecnicoId : UUID
        +setorId : UUID
        +equipamentoId : UUID
        +titulo : String
        +descricao : String
        +categoria : Categoria
        +prioridade : Prioridade
        +status : StatusChamado
        +prazoResolucao : DateTime
        +abertoEm : DateTime
        +resolvidoEm : DateTime
        +fechadoEm : DateTime
        +atualizadoEm : DateTime
    }

    class HistoricoChamado {
        +id : UUID
        +chamadoId : UUID
        +autorId : UUID
        +tipo : TipoHistorico
        +conteudo : String
        +interno : Boolean
        +criadoEm : DateTime
    }

    class Anexo {
        +id : UUID
        +chamadoId : UUID
        +enviadoPor : UUID
        +nomeArquivo : String
        +mimeType : String
        +tamanho : Int
        +caminho : String
        +criadoEm : DateTime
    }

    class Avaliacao {
        +id : UUID
        +chamadoId : UUID
        +nota : Int
        +comentario : String
        +criadoEm : DateTime
    }

    class Perfil {
        <<enumeration>>
        SOLICITANTE
        TECNICO
        ADMIN
    }

    class Categoria {
        <<enumeration>>
        HARDWARE
        SOFTWARE
        REDE
        ACESSO
        OUTROS
    }

    class Prioridade {
        <<enumeration>>
        BAIXA
        MEDIA
        ALTA
        CRITICA
    }

    class StatusChamado {
        <<enumeration>>
        ABERTO
        EM_ANDAMENTO
        AGUARDANDO
        RESOLVIDO
        FECHADO
        CANCELADO
    }

    class TipoHistorico {
        <<enumeration>>
        CRIACAO
        MUDANCA_STATUS
        ATRIBUICAO
        FOLLOWUP
        REABERTURA
        CANCELAMENTO
    }

    Organizacao "1" *-- "0..*" Setor : possui
    Organizacao "1" *-- "0..*" Usuario : possui
    Organizacao "1" *-- "0..*" Equipamento : possui
    Organizacao "1" *-- "0..*" Chamado : possui
    Organizacao "1" *-- "0..*" Sla : possui

    Setor "0..1" --> "0..*" Usuario : aloca
    Setor "0..1" --> "0..*" Equipamento : aloca
    Setor "1" --> "0..*" Chamado : recebe

    Usuario "0..1" --> "0..*" Equipamento : responsavel
    Usuario "1" --> "0..*" Chamado : solicita
    Usuario "0..1" --> "0..*" Chamado : atende
    Usuario "1" --> "0..*" HistoricoChamado : autor
    Usuario "1" --> "0..*" Anexo : envia

    Equipamento "0..1" --> "0..*" Chamado : relacionado

    Chamado "1" *-- "0..*" HistoricoChamado : registra
    Chamado "1" *-- "0..*" Anexo : anexa
    Chamado "1" --> "0..1" Avaliacao : avaliado por

    Usuario --> Perfil
    Chamado --> Categoria
    Chamado --> Prioridade
    Chamado --> StatusChamado
    Sla --> Prioridade
    HistoricoChamado --> TipoHistorico

    Chamado ..> Sla : prazo pela prioridade
```

## Leitura

- A organização é a raiz do tenant. Setor, usuário, equipamento, chamado e SLA não existem fora dela.
- O chamado exige solicitante e setor. Técnico e equipamento são opcionais.
- Histórico e anexo são excluídos em cascata com o chamado. A avaliação é no máximo uma por chamado.
- O SLA não aponta para um chamado. Há uma configuração por prioridade em cada organização, e o prazo de resolução do chamado sai dessa configuração.
- E-mail de usuário é único dentro da organização. Nome de setor também. Avaliação é única por chamado.

Campos opcionais no banco: `Usuario.setorId`, `telefone` e `especialidade`; `Equipamento.setorId`, `usuarioId`, `patrimonio` e `tipo`; `Chamado.tecnicoId`, `equipamentoId`, `prazoResolucao`, `resolvidoEm` e `fechadoEm`; `HistoricoChamado.conteudo`; `Avaliacao.comentario`.
