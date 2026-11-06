# Atividades

Lista de ideias do time, mantida como roteiro de evolução. Prazos, situação e critérios de conclusão ficam no [backlog](backlog.md).

Marcações: `[A]` Arthur (concluídas em 06/11/2026, commit `947e953`); `[B]` Bryan; `[ ]` sem responsável definido.

[ ]Anexos no chamado
O modelo Anexo já existe no Prisma (RF14), mas a UI não sobe arquivo. Prints, logs e PDF no chamado e no histórico. É o que mais parece “sistema de TI de verdade” numa banca.

[A]Monitor de SLA
O prazo já é gravado em prazoResolucao. Falta o uso: semáforo na lista (no prazo / perto / estourado), contagem regressiva no detalhe e um bloco no painel “em risco”. Liga o RF09 à tela e diferencia o projeto de um CRUD.

[ ]Equipamentos com histórico
O modelo Equipamento também já está no schema (RF04). Cadastro de ativos (nome, patrimônio, setor) e vínculo no chamado. Abrir um PC e ver os chamados anteriores dele fecha o ciclo “ativo → problema → atendimento”.

[A]Modo manutenção
 Botão só do admin: “entrar em manutenção”. Toda a organização vê um banner com o motivo e a previsão de retorno. Enquanto ativo, ninguém abre chamado, muda status nem cadastra — só consulta. Login continua liberado. A API bloqueia as escritas; o front só mostra o aviso. Admin consegue sair do modo a qualquer hora. 

[ ]Base de conhecimento
Artigos curtos por categoria (“VPN não conecta”, “impressora offline”). Na abertura do chamado, o sistema sugere 2 ou 3 artigos parecidos com o título. Se o problema se resolver ali, o chamado nem nasce.

[B]Comentários com menção
No follow-up, @nome avisa o técnico ou o solicitante. Aparece um sino no topo com o que ainda não foi lido. Útil quando o chamado está “Aguardando” e alguém precisa responder.

[B]Fila “minha vez”
Tela do técnico só com chamados atribuídos a ele, ordenados por SLA e prioridade. Um botão “pegar próximo” puxa o mais urgente da fila sem dono. Menos escolha manual, menos chamado parado.

[B]Relatório exportável
No painel, baixar CSV ou PDF do período: volume por status, tempo médio, notas de avaliação e chamados estourados. Serve para a banca e para o gestor da TI.

[A]Reabertura com causa
Ao reabrir, obrigar motivo em lista (voltou a falhar, solução incompleta, usuário não validou). O painel ganha um indicador de reincidência por categoria e por técnico.

[ ]Revisão hierárquica
Aprendiz, seja técnico ou solicitante, não conclui sozinho. Técnico aprendiz: ao marcar Resolvido, o chamado vai para “Aguardando revisão” e o superior confirma ou devolve. Solicitante aprendiz: ao abrir o chamado, um superior do setor valida título, prioridade e se realmente precisa ir para a TI — só então entra na fila. O admin define quem é aprendiz e quem revisa em cada perfil.