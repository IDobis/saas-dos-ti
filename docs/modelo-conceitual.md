# Modelo conceitual

Entidades do `schema.prisma`. Técnico não é entidade: é um usuário com perfil `TECNICO` e especialidade opcional. Categoria, prioridade, status e tipo de histórico são enumerações, não tabelas. O SLA é uma configuração por prioridade em cada organização.

```mermaid
erDiagram
  ORGANIZACAO ||--o{ SETOR : possui
  ORGANIZACAO ||--o{ USUARIO : possui
  ORGANIZACAO ||--o{ EQUIPAMENTO : possui
  ORGANIZACAO ||--o{ CHAMADO : possui
  ORGANIZACAO ||--o{ SLA : possui

  SETOR |o--o{ USUARIO : aloca
  SETOR |o--o{ EQUIPAMENTO : aloca
  SETOR ||--o{ CHAMADO : recebe

  USUARIO |o--o{ EQUIPAMENTO : responsavel
  USUARIO ||--o{ CHAMADO : solicita
  USUARIO |o--o{ CHAMADO : atende
  USUARIO ||--o{ HISTORICO : escreve
  USUARIO ||--o{ ANEXO : envia

  EQUIPAMENTO |o--o{ CHAMADO : referencia
  CHAMADO ||--o{ HISTORICO : registra
  CHAMADO ||--o{ ANEXO : anexa
  CHAMADO ||--o| AVALIACAO : recebe
  SLA }o--|| PRIORIDADE : define
  CHAMADO }o--|| PRIORIDADE : classifica

  ORGANIZACAO {
    uuid id PK
    string nome
    boolean ativa
  }

  SETOR {
    uuid id PK
    string nome
    boolean ativo
  }

  USUARIO {
    uuid id PK
    string nome
    string email
    string perfil
    string especialidade
    boolean ativo
  }

  EQUIPAMENTO {
    uuid id PK
    string nome
    string patrimonio
    string tipo
    boolean ativo
  }

  SLA {
    uuid id PK
    string prioridade
    int minutosAtendimento
    int minutosResolucao
  }

  CHAMADO {
    uuid id PK
    int numero
    string titulo
    string descricao
    string categoria
    string prioridade
    string status
    datetime prazoResolucao
    datetime abertoEm
  }

  HISTORICO {
    uuid id PK
    string tipo
    string conteudo
    boolean interno
    datetime criadoEm
  }

  ANEXO {
    uuid id PK
    string nomeArquivo
    string caminho
    int tamanho
  }

  AVALIACAO {
    uuid id PK
    int nota
    string comentario
  }

  PRIORIDADE {
    string BAIXA
    string MEDIA
    string ALTA
    string CRITICA
  }
```

## Leitura

- A organização agrupa setor, usuário, equipamento, chamado e SLA.
- Setor do usuário e do equipamento é opcional. Setor do chamado é obrigatório.
- O chamado exige solicitante. Técnico e equipamento são opcionais.
- Há no máximo uma avaliação por chamado.
- O prazo do chamado não aponta para uma linha de SLA. Ele é calculado pela prioridade da organização.
