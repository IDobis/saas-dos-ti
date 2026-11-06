# Evidências de teste

Prints e registros da execução dos [casos de teste](../../casos-de-teste.md).

## Situação atual

| Evidência | Situação |
| --- | --- |
| [`execucao-api-2026-11-06.json`](execucao-api-2026-11-06.json) | Gerada: saída real do roteiro da API, sem tokens nem senhas |
| Prints de tela | **Pendentes**: a equipe precisa tirá-los durante o ensaio da demonstração |

## Como nomear os prints

Use `CTnn-descricao-curta.png`, em minúsculas, sem acentos, e salve nesta pasta.

## Prints a tirar

| Arquivo | O que deve aparecer |
| --- | --- |
| `CT01-login.png` | Tela de login |
| `CT02-cadastros.png` | Setores e usuários em `/cadastros` |
| `CT03-abrir-chamado.png` | Formulário preenchido ou o detalhe do chamado aberto |
| `CT04-lista-filtros.png` | Lista com um filtro aplicado |
| `CT05-sem-tecnico.png` | Aviso "Atribua um técnico antes de iniciar o atendimento" |
| `CT06-historico.png` | Histórico com as mudanças de status |
| `CT07-nota-interna.png` | Nota interna vista pelo técnico |
| `CT08-avaliacao.png` | Avaliação enviada |
| `CT09-painel.png` | Indicadores do painel |
| `CT10-sla-lista.png` | Semáforo na coluna SLA |
| `CT10-sla-detalhe.png` | Contagem regressiva no detalhe |
| `CT11-manutencao.png` | Banner de manutenção ativo |
| `CT12-reabertura.png` | Formulário de reabertura com a lista de causas |
| `CT12-reincidencia.png` | Bloco "Reincidência" no painel |
| `CT14-menu-solicitante.png` | Menu reduzido do solicitante |
| `CT15-cancelamento.png` | Justificativa vazia com "Confirmar" desabilitado |

## Cuidados

- Não coloque senhas, tokens nem o conteúdo de `apps/api/.env` nos prints.
- Só registre print de algo que aconteceu de fato. Se o resultado divergir do esperado, atualize o caso em [`casos-de-teste.md`](../../casos-de-teste.md).
- Use dados de teste, sem dados pessoais reais.
