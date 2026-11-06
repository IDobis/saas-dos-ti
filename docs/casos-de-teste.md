# Casos de teste

Casos do fluxo integrado do OSQ-Resolve, com o resultado da execução de 06/11/2026.

## Como foram executados

| Item | Detalhe |
| --- | --- |
| Versão | Commit `9b7d88e`, branch `Lucas` |
| Ambiente | Windows 11, Node.js 24.16.0, PostgreSQL 18 local, API em `:3001` e front em `:3100` |
| Execução pela API | Roteiro [`testes/executar-casos-api.mjs`](testes/executar-casos-api.mjs): 116 verificações, 116 aprovadas |
| Resultado bruto | [`testes/evidencias/execucao-api-2026-11-06.json`](testes/evidencias/execucao-api-2026-11-06.json) |
| Execução pela tela | Sessão no Chrome, em uma organização de teste criada pela própria tela |
| Executado por | Claude Code (assistente de IA), a pedido da equipe. **A equipe ainda precisa repetir o fluxo e registrar os prints** ([instruções](testes/evidencias/README.md)) |

Situações usadas:

- **Aprovado:** o observado coincide com o esperado.
- **Aprovado com ressalva:** o que foi testado passou, mas parte do requisito falta ou não foi exercitada na tela. A ressalva está no caso.
- **Não executável:** a funcionalidade não existe, então não há o que testar.

Não há testes automatizados de unidade no projeto. O roteiro acima testa a API em funcionamento, de ponta a ponta.

## Resumo

| ID | Tema | Requisitos | API | Tela | Situação |
| --- | --- | --- | --- | --- | --- |
| CT01 | Login | RF13 | 5/5 | Sim | Aprovado |
| CT02 | Cadastros | RF01, RF02, RF03 | 8/8 | Parcial | Aprovado com ressalva |
| CT03 | Abertura | RF05, RF06, RF15, RN01, RN02, RN05 | 6/6 | Sim | Aprovado com ressalva |
| CT04 | Consulta e filtros | RF12, RN09 | 9/9 | Parcial | Aprovado com ressalva |
| CT05 | Atribuição | RF07, RN03, RN05 | 6/6 | Sim | Aprovado |
| CT06 | Status e histórico | RF08, RF09, RN04, RN05 | 6/6 | Sim | Aprovado |
| CT07 | Follow-up | RF08, RN12 | 5/5 | Não | Aprovado com ressalva |
| CT08 | Avaliação | RF10, RN07 | 6/6 | Sim | Aprovado |
| CT09 | Painel | RF11, RN14 | 5/5 | Sim | Aprovado com ressalva |
| CT10 | SLA na tela | RF09, RN02 | 2/2 | Sim | Aprovado com ressalva |
| CT11 | Modo manutenção | RNF03, RN09 | 12/12 | Sim | Aprovado |
| CT12 | Reabertura com causa | RN13, RN06 | 13/13 | Sim | Aprovado |
| CT13 | Negativo: campo obrigatório | RN01 | 4/4 | Não | Aprovado |
| CT14 | Negativo: perfil sem permissão | RN09, RF13 | 6/6 | Sim | Aprovado |
| CT15 | Negativo: cancelamento sem justificativa | RF16, RN10 | 6/6 | Parcial | Aprovado |
| CT16 | Isolamento entre organizações | RNF08 | 2/2 | Não | Aprovado |
| CT17 | Inativação | RF01, RF03, RN11 | 6/6 | Não | Aprovado |
| CT18 | Dados de demonstração | Apoio à demo | 6/6 | Não | Aprovado |
| CT19 | Limite de tentativas | RNF04 | 3/3 | Não | Aprovado |
| CT20 | Anexos | RF14 | — | — | Não executável |
| CT21 | Equipamentos | RF04, RN08 | — | — | Não executável |

Data de todos os casos executados: 06/11/2026. Versão: `9b7d88e`.

## Fluxo integrado

### CT01 — Login

| Campo | Conteúdo |
| --- | --- |
| Requisito | RF13 |
| Condições | API e banco no ar, sem sessão aberta |
| Passos | 1. Cadastrar organização em `/login`. 2. Consultar `/auth/me`. 3. Chamar rota protegida sem token. 4. Entrar com senha errada |
| Entrada | Organização, nome, e-mail e senha de teste |
| Esperado | Cadastro entra como administrador; sem token e senha errada dão 401 |
| Observado | API: cadastro 201 com perfil `ADMIN`, `/auth/me` 200, sem token 401, senha errada 401. Tela: redirecionou para `/dashboard` após o cadastro; senha errada mostrou "E-mail ou senha inválidos" |
| Situação | Aprovado |

### CT02 — Cadastros básicos

| Campo | Conteúdo |
| --- | --- |
| Requisito | RF01, RF02, RF03 |
| Condições | Logado como administrador |
| Passos | 1. Criar setor. 2. Repetir o nome. 3. Criar técnico e solicitante. 4. Entrar com cada um |
| Entrada | Setor "Financeiro"; usuários com perfis `TECNICO` e `SOLICITANTE` |
| Esperado | Setor e usuários criados; nome de setor repetido recusado |
| Observado | API: setor 201, repetido 409, usuários 201, técnico guardou a especialidade, logins emitiram token. Tela: setor e solicitante criados em `/cadastros` |
| Situação | Aprovado com ressalva: não existe edição de usuário (RF01); o formulário da tela não tem especialidade nem telefone, só a API aceita |

### CT03 — Abrir chamado

| Campo | Conteúdo |
| --- | --- |
| Requisito | RF05, RF06, RF15, RN01, RN02, RN05 |
| Condições | Usuário logado e setor ativo |
| Passos | 1. Abrir chamado de prioridade média. 2. Abrir chamado crítico. 3. Conferir o histórico |
| Entrada | Título, descrição, categoria, prioridade e setor |
| Esperado | Status Aberto; prazo de 24 h (média) e 4 h (crítica); histórico de criação |
| Observado | API: 201, status `ABERTO`, prazos de 24,00 h e 4,00 h, histórico `CRIACAO`. Tela: chamado crítico aberto às 17:44 com prazo às 21:44 |
| Situação | Aprovado com ressalva: a tela não oferece equipamento (RF05), pois não há cadastro de equipamentos |

### CT04 — Listar e filtrar

| Campo | Conteúdo |
| --- | --- |
| Requisito | RF12, RN09 |
| Condições | Três chamados abertos por dois usuários |
| Passos | Filtrar por status, prioridade, categoria, setor, solicitante, período, técnico e busca; listar como solicitante |
| Entrada | Parâmetros de filtro em `GET /chamados` |
| Esperado | Só os chamados que atendem ao filtro; solicitante vê apenas os próprios |
| Observado | API: todos os filtros corretos; solicitante viu 2 chamados, sem o do técnico. Tela: lista carregou com busca, status e prioridade visíveis, mas esses controles não foram acionados |
| Situação | Aprovado com ressalva: categoria, técnico, setor, solicitante e período existem na API, mas não têm controle na tela |

### CT05 — Atribuir técnico

| Campo | Conteúdo |
| --- | --- |
| Requisito | RF07, RN03, RN05 |
| Condições | Chamado aberto sem técnico |
| Passos | 1. Tentar iniciar o atendimento. 2. Atribuir como solicitante. 3. Escolher um solicitante como técnico. 4. Atribuir um técnico válido |
| Entrada | `tecnicoId` |
| Esperado | Início sem técnico recusado; solicitante sem permissão; atribuição válida registrada no histórico |
| Observado | API: 400, 403, 400 e 200, histórico `ATRIBUICAO`. Tela: aviso "Atribua um técnico antes de iniciar o atendimento"; depois, "Atribuído a Admin Tela" no histórico |
| Situação | Aprovado |

### CT06 — Mudar status e registrar histórico

| Campo | Conteúdo |
| --- | --- |
| Requisito | RF08, RF09, RN04, RN05 |
| Condições | Chamado com técnico |
| Passos | Tentar Aberto → Fechado; seguir Aberto → Em andamento → Aguardando → Em andamento; tentar resolver como solicitante |
| Entrada | `status` |
| Esperado | Transição inválida recusada; cada mudança gera histórico com autor e data |
| Observado | API: inválida 400; válidas 200; solicitante 403; 3 registros com autor. Tela: histórico exibiu "Status: ABERTO → EM_ANDAMENTO" com autor e horário; só os botões de transições válidas aparecem |
| Situação | Aprovado |

### CT07 — Follow-up

| Campo | Conteúdo |
| --- | --- |
| Requisito | RF08, RN12 |
| Condições | Chamado em andamento |
| Passos | 1. Solicitante comenta. 2. Técnico grava nota interna. 3. Solicitante tenta gravar nota interna. 4. Comparar o que cada um vê |
| Entrada | `conteudo`, `interno` |
| Esperado | Nota interna visível só para a equipe; solicitante não cria nota interna |
| Observado | API: 201 nos dois; a nota do solicitante foi gravada com `interno=false`; solicitante viu 7 registros, técnico viu 8 |
| Situação | Aprovado com ressalva: não exercitado pela tela |

### CT08 — Avaliar atendimento

| Campo | Conteúdo |
| --- | --- |
| Requisito | RF10, RN07 |
| Condições | Chamado aberto pelo próprio usuário |
| Passos | Avaliar antes de resolver; avaliar como técnico; nota 6; avaliar corretamente; avaliar de novo |
| Entrada | `nota` de 1 a 5, comentário opcional |
| Esperado | Só o solicitante, só após a resolução, uma única vez |
| Observado | API: 400, 403, 400, 201 e 409. Tela: 4 estrelas enviadas, aviso "Obrigado pela avaliação!", formulário sumiu |
| Situação | Aprovado |

### CT09 — Painel

| Campo | Conteúdo |
| --- | --- |
| Requisito | RF11, RN14 |
| Condições | Um chamado resolvido |
| Passos | Consultar o painel; consultar um período sem conclusões |
| Entrada | `GET /dashboard`, parâmetro `ate` |
| Esperado | Concluídos e tempo médio contam só os concluídos; período vazio sem indicador |
| Observado | API: concluídos 1, 100% no prazo; período vazio: concluídos 0 e tempo nulo. Tela: abertos 2, concluídos 1, tempo médio 3 min, no prazo 100% |
| Situação | Aprovado com ressalva: a API filtra por período, mas a tela só permite escolher o ano do primeiro gráfico |

### CT10 — SLA na tela

| Campo | Conteúdo |
| --- | --- |
| Requisito | RF09, RN02 |
| Condições | Chamados criados na organização de teste. Para não esperar horas, as datas de 2 deles foram ajustadas diretamente no banco |
| Passos | Ver o semáforo na lista, a contagem no detalhe e o bloco "Em risco de SLA" no painel |
| Entrada | Chamado novo; chamado a 1 h do prazo de 7 h; chamado 1 h atrasado |
| Esperado | Verde no prazo; amarelo com 25% ou menos restando; vermelho estourado; resolvido indica se cumpriu |
| Observado | Lista: "3h 58min" verde, "59min" amarelo, "-1h 00min" vermelho. Detalhe: "No prazo, Faltam 3h 59min"; "Perto do prazo, Faltam 57min 59s"; resolvido: "Cumprido, Resolvido 3h 57min antes do prazo". Painel: "1 estourado, 1 perto" |
| Situação | Aprovado com ressalva: os estados "Fora do prazo" e "Sem SLA" não foram vistos na tela |

> Para a demonstração: os chamados gerados pelo botão **Demo** não têm prazo (CT18), então aparecem como "Sem SLA". Para mostrar o semáforo, abra um chamado pelo formulário.

### CT11 — Modo manutenção

| Campo | Conteúdo |
| --- | --- |
| Requisito | RNF03, RN09 |
| Condições | Administrador logado e uma segunda organização cadastrada |
| Passos | 1. Solicitante tenta ativar. 2. Admin ativa com motivo. 3. Tentar escrever e consultar. 4. Fazer login. 5. Escrever na outra organização. 6. Encerrar |
| Entrada | `motivo` |
| Esperado | Só admin controla; escrita bloqueada; consulta e login liberados; outra organização não é afetada |
| Observado | API: solicitante 403; ativação 201; abrir chamado, mudar status e cadastrar 503; consulta 200; login 201; outra organização 201; encerrar 200; escrita volta. Tela: banner "Sistema em manutenção: Teste de tela CT11"; criar setor mostrou o aviso de manutenção; "Encerrar manutenção" removeu o banner |
| Situação | Aprovado |

### CT12 — Reabertura com causa

| Campo | Conteúdo |
| --- | --- |
| Requisito | RN13, RN06 |
| Condições | Chamado resolvido |
| Passos | 1. Reabrir como solicitante. 2. Reabrir sem causa e com causa inválida. 3. Reabrir chamado não resolvido. 4. Reabrir corretamente. 5. Ver o indicador de reincidência. 6. Fechar e tentar comentar |
| Entrada | `causa`, `justificativa` |
| Esperado | Só a equipe reabre; causa obrigatória e da lista; volta para Em andamento com prazo novo; fechado não recebe comentário |
| Observado | API: 403, 400, 400, 400 e 200; status `EM_ANDAMENTO`, resolução apagada, prazo de 24,00 h; histórico com a causa; reincidência total 1; solicitante 403 no indicador; comentar em fechado 400. Tela: "Confirmar" desabilitado sem causa; histórico "Reaberto (voltou a falhar)"; painel "Voltou a falhar: 1, Hardware 100%" |
| Situação | Aprovado |

## Casos negativos

### CT13 — Campo obrigatório vazio

| Campo | Conteúdo |
| --- | --- |
| Requisito | RN01 |
| Condições | Solicitante logado |
| Passos | Enviar chamado sem título, com título curto, com categoria inválida e com setor inexistente |
| Entrada | Corpo de `POST /chamados` |
| Esperado | Recusa com mensagem, sem criar o chamado |
| Observado | API: 400 nos quatro casos. As mensagens de validação vêm em inglês (ex.: "titulo must be longer than or equal to 3 characters") |
| Situação | Aprovado |

### CT14 — Perfil sem permissão

| Campo | Conteúdo |
| --- | --- |
| Requisito | RN09, RF13 |
| Condições | Logado como solicitante e como técnico |
| Passos | Criar setor e usuário; abrir o painel; gerar demonstração; abrir chamado de outra pessoa; abrir `/cadastros` na tela |
| Entrada | Tokens de cada perfil |
| Esperado | Recusa pela API e opções ocultas na tela |
| Observado | API: 403 nas 6 tentativas. Tela do solicitante: menu só com Chamados e Novo chamado, sem Manutenção e Demo; `/cadastros` redirecionou para `/chamados` |
| Situação | Aprovado |

### CT15 — Cancelamento sem justificativa

| Campo | Conteúdo |
| --- | --- |
| Requisito | RF16, RN10 |
| Condições | Chamado aberto |
| Passos | Cancelar sem justificativa e só com espaços; cancelar chamado de outra pessoa; cancelar com justificativa; cancelar chamado fechado |
| Entrada | `status=CANCELADO`, `justificativa` |
| Esperado | Exige justificativa; só antes de resolvido ou fechado; texto fica no histórico |
| Observado | API: 400, 400, 403, 200, com a justificativa no histórico; fechado 400. Tela: "Confirmar" desabilitado sem texto; o cancelamento em si não foi concluído pela tela |
| Situação | Aprovado |

## Casos complementares

### CT16 — Isolamento entre organizações

| Campo | Conteúdo |
| --- | --- |
| Requisito | RNF08 |
| Condições | Duas organizações |
| Passos | O admin da organização B tenta abrir e listar chamados da organização A |
| Entrada | Id de chamado da organização A |
| Esperado | Dados não aparecem |
| Observado | API: 404 ao abrir; lista com 0 chamados |
| Situação | Aprovado |

### CT17 — Inativação

| Campo | Conteúdo |
| --- | --- |
| Requisito | RF01, RF03, RN11 |
| Condições | Administrador logado |
| Passos | Tentar excluir setor; inativar setor e abrir chamado nele; inativar usuário e usar o token dele |
| Entrada | Ids de setor e usuário |
| Esperado | Sem exclusão; setor inativo não recebe chamado; token do usuário inativado deixa de valer |
| Observado | API: exclusão 404 (rota não existe); inativar 200; chamado no setor inativo 400; token do inativado 401 |
| Situação | Aprovado |

### CT18 — Dados de demonstração

| Campo | Conteúdo |
| --- | --- |
| Requisito | Apoio à demonstração |
| Condições | Administrador logado e chamados reais na organização |
| Passos | Gerar 5 chamados; apagar; conferir um chamado real |
| Entrada | Quantidades e período |
| Esperado | Apaga só o que o botão gerou |
| Observado | API: 5 criados, todos sem prazo de SLA; 5 removidos; chamado real continua existindo |
| Situação | Aprovado |

### CT19 — Limite de tentativas de login

| Campo | Conteúdo |
| --- | --- |
| Requisito | RNF04 |
| Condições | Janela de 60 s sem outras tentativas |
| Passos | Fazer 6 logins em menos de um minuto; chamar `/auth/me` 10 vezes |
| Entrada | Credenciais de teste |
| Esperado | Sexta tentativa recebe 429; `/auth/me` não é limitado |
| Observado | API: sequência 401, 201, 201, 201, 201, 429; `/auth/me` respondeu 200 nas 10 chamadas. O primeiro 401 confirma também que usuário inativado não entra |
| Situação | Aprovado |

## Funcionalidades ainda não testáveis

### CT20 — Anexos

| Campo | Conteúdo |
| --- | --- |
| Requisito | RF14 |
| Condições | Depende da implementação |
| Passos | Anexar arquivo a um chamado |
| Entrada | Print, log ou PDF |
| Esperado | Arquivo ligado ao chamado e visível no detalhe |
| Observado | PENDENTE — existe só o modelo `Anexo` no banco; não há rota de envio nem tela |
| Situação | Não executável |

### CT21 — Equipamentos

| Campo | Conteúdo |
| --- | --- |
| Requisito | RF04, RN08 |
| Condições | Depende da implementação |
| Passos | Cadastrar equipamento e vinculá-lo a um chamado de outro setor |
| Entrada | Nome, patrimônio, setor |
| Esperado | Equipamento cadastrado; vínculo fora do setor recusado |
| Observado | PENDENTE — existe o modelo `Equipamento` e a validação da RN08 na abertura, mas não há rota de cadastro nem tela |
| Situação | Não executável |

## Como repetir

Com a API no ar, na raiz do repositório:

```bash
node docs/testes/executar-casos-api.mjs docs/testes/evidencias/execucao-api-AAAA-MM-DD.json
```

Leva cerca de 1 minuto e cria organizações novas chamadas `CT Testes ...`. Ao terminar, o login fica bloqueado por até 60 s neste IP, efeito esperado do CT19.
