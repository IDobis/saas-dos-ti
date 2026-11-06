// Executa pela API HTTP os casos de docs/casos-de-teste.md e grava o resultado em JSON.
// Uso: node docs/testes/executar-casos-api.mjs [arquivo-saida.json]   (API_URL muda o alvo)
// Cria duas organizações novas a cada execução; não altera dados de outras organizações.
// Leva cerca de 1 min: espera a janela de 60 s do limite de login (5/min por IP).
// Ao final, o login fica bloqueado por até 60 s neste IP (efeito do caso CT19).
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const API = process.env.API_URL ?? 'http://localhost:3001/api';
const SAIDA = process.argv[2];
const RODADA = Date.now();
const SENHA = randomBytes(12).toString('hex'); // descartável; nunca é gravada
const email = (quem) => `ct-${quem}-${RODADA}@example.com`;

const resultados = [];
let casoAtual = '';
const caso = (id) => (casoAtual = id);

function checar(descricao, ok, observado) {
  resultados.push({ caso: casoAtual, descricao, ok: !!ok, observado: String(observado) });
  console.log(`${ok ? 'ok  ' : 'FALHA'} ${casoAtual} ${descricao} -> ${observado}`);
}

async function req(metodo, rota, { token, body } = {}) {
  const r = await fetch(API + rota, {
    method: metodo,
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const texto = await r.text();
  let data = null;
  try {
    data = JSON.parse(texto);
  } catch {
    data = texto;
  }
  return { status: r.status, data };
}

/** Confere só o código HTTP e registra a mensagem devolvida pela API. */
async function espera(descricao, codigo, metodo, rota, opcoes) {
  const r = await req(metodo, rota, opcoes);
  const msg = r.status >= 400 && r.data?.message ? ` (${[r.data.message].flat().join('; ')})` : '';
  checar(descricao, r.status === codigo, `HTTP ${r.status}${msg}`);
  return r;
}

const login = (quem) => req('POST', '/auth/login', { body: { email: email(quem), senha: SENHA } });
const novoChamado = (setorId, extra = {}) => ({
  titulo: 'Impressora não imprime',
  descricao: 'Fila travada desde a manhã.',
  categoria: 'HARDWARE',
  prioridade: 'MEDIA',
  setorId,
  ...extra,
});
const horasAte = (iso) => (new Date(iso).getTime() - Date.now()) / 3_600_000;
const esperarJanelaDeLogin = () => new Promise((ok) => setTimeout(ok, 61_000));

// ---------- CT01: autenticação ----------
caso('CT01');
const regA = await espera('Cadastrar organização e administrador', 201, 'POST', '/auth/registrar', {
  body: { organizacao: `CT Testes A ${RODADA}`, nome: 'Admin CT', email: email('admin'), senha: SENHA },
});
const admin = regA.data.token;
checar('Quem cadastra a organização é administrador', regA.data.usuario?.perfil === 'ADMIN', regA.data.usuario?.perfil);
await espera('Token dá acesso a /auth/me', 200, 'GET', '/auth/me', { token: admin });
await espera('Rota protegida sem token é recusada', 401, 'GET', '/chamados');
const loginErrado = await req('POST', '/auth/login', { body: { email: email('admin'), senha: 'senha-errada-123' } });
checar('Senha errada é recusada', loginErrado.status === 401, `HTTP ${loginErrado.status} (${loginErrado.data?.message})`);

// ---------- CT02: cadastros ----------
caso('CT02');
const setores0 = await req('GET', '/setores', { token: admin });
checar('Organização nasce com o setor TI', setores0.data.some?.((s) => s.nome === 'TI'), `${setores0.data.length} setor(es)`);
const setor = (await espera('Admin cria setor', 201, 'POST', '/setores', { token: admin, body: { nome: 'Financeiro' } })).data;
await espera('Setor com nome repetido é recusado', 409, 'POST', '/setores', { token: admin, body: { nome: 'Financeiro' } });
const criarUsuario = (quem, perfil, extra = {}) =>
  espera(`Admin cria usuário ${perfil}`, 201, 'POST', '/usuarios', {
    token: admin,
    body: { nome: `${quem} CT`, email: email(quem), senha: SENHA, perfil, ...extra },
  });
const tecUsuario = (await criarUsuario('tecnico', 'TECNICO', { especialidade: 'Redes' })).data;
checar('Técnico guarda a especialidade', tecUsuario.especialidade === 'Redes', tecUsuario.especialidade);
const solUsuario = (await criarUsuario('solicitante', 'SOLICITANTE', { setorId: setor.id })).data;
const sol2Usuario = (await criarUsuario('solicitante2', 'SOLICITANTE')).data;
const tec = (await login('tecnico')).data.token;
const sol = (await login('solicitante')).data.token;
const sol2 = (await login('solicitante2')).data.token;
checar('Técnico e solicitantes fazem login', tec && sol && sol2, tec && sol && sol2 ? 'tokens emitidos' : 'sem token');

// ---------- CT03: abertura ----------
caso('CT03');
const c1 = (await espera('Solicitante abre chamado', 201, 'POST', '/chamados', { token: sol, body: novoChamado(setor.id) })).data;
checar('Status inicial é ABERTO (RN01)', c1.status === 'ABERTO', c1.status);
checar('Chamado recebe número', Number.isInteger(c1.numero), `#${c1.numero}`);
const horasMedia = horasAte(c1.prazoResolucao);
checar('Prioridade média: prazo de 24 h (RN02)', Math.abs(horasMedia - 24) < 0.1, `${horasMedia.toFixed(2)} h`);
const c2 = (await req('POST', '/chamados', { token: sol, body: novoChamado(setor.id, { prioridade: 'CRITICA', categoria: 'REDE', titulo: 'Sem acesso à rede' }) })).data;
const horasCritica = horasAte(c2.prazoResolucao);
checar('Prioridade crítica: prazo de 4 h (RN02)', Math.abs(horasCritica - 4) < 0.1, `${horasCritica.toFixed(2)} h`);
const det1 = (await req('GET', `/chamados/${c1.id}`, { token: sol })).data;
checar('Abertura gera histórico CRIACAO (RN05)', det1.historico?.[0]?.tipo === 'CRIACAO', det1.historico?.[0]?.tipo);
const c3 = (await req('POST', '/chamados', { token: tec, body: novoChamado(setor.id, { titulo: 'Chamado do técnico' }) })).data;

// ---------- CT04: consulta ----------
caso('CT04');
const lista = async (q, token = tec) => (await req('GET', `/chamados?${new URLSearchParams(q)}`, { token })).data;
const ids = (l) => l.map((c) => c.id);
const filtro = (nome, l, cond) => checar(`Filtro por ${nome}`, l.length > 0 && l.every(cond), `${l.length} resultado(s)`);
filtro('status', await lista({ status: 'ABERTO' }), (c) => c.status === 'ABERTO');
filtro('prioridade', await lista({ prioridade: 'CRITICA' }), (c) => c.prioridade === 'CRITICA');
filtro('categoria', await lista({ categoria: 'REDE' }), (c) => c.categoria === 'REDE');
filtro('setor', await lista({ setorId: setor.id }), (c) => c.setor.id === setor.id);
filtro('solicitante', await lista({ solicitanteId: solUsuario.id }), (c) => c.solicitante.id === solUsuario.id);
filtro('busca no título', await lista({ busca: 'rede' }), (c) => c.titulo.includes('rede'));
filtro('busca por número', await lista({ busca: `#${c1.numero}` }), (c) => c.numero === c1.numero);
const ontem = new Date(Date.now() - 86_400_000).toISOString();
checar('Filtro por período sem chamados', (await lista({ ate: ontem })).length === 0, '0 resultado(s)');
const doSol = await lista({}, sol);
checar('Solicitante só vê os próprios chamados (RN09)', ids(doSol).includes(c1.id) && !ids(doSol).includes(c3.id), `${doSol.length} chamado(s)`);

// ---------- CT05: encaminhamento ----------
caso('CT05');
await espera('Iniciar atendimento sem técnico é recusado (RN03)', 400, 'PATCH', `/chamados/${c1.id}/status`, { token: tec, body: { status: 'EM_ANDAMENTO' } });
await espera('Solicitante não atribui técnico', 403, 'PATCH', `/chamados/${c1.id}/atribuir`, { token: sol, body: { tecnicoId: tecUsuario.id } });
await espera('Solicitante não pode ser escolhido como técnico', 400, 'PATCH', `/chamados/${c1.id}/atribuir`, { token: admin, body: { tecnicoId: solUsuario.id } });
await espera('Técnico é atribuído', 200, 'PATCH', `/chamados/${c1.id}/atribuir`, { token: admin, body: { tecnicoId: tecUsuario.id } });
filtro('técnico', await lista({ tecnicoId: tecUsuario.id }), (c) => c.tecnico?.id === tecUsuario.id);
const historico = async (id, token = tec) => (await req('GET', `/chamados/${id}`, { token })).data.historico;
const tipos = async (id) => (await historico(id)).map((h) => h.tipo);
checar('Atribuição gera histórico (RN05)', (await tipos(c1.id)).includes('ATRIBUICAO'), (await tipos(c1.id)).join(','));

// ---------- CT06: status ----------
caso('CT06');
const mudar = (id, status, token = tec, extra = {}) => ({ token, body: { status, ...extra } });
await espera('Transição direta ABERTO -> FECHADO é recusada (RN04)', 400, 'PATCH', `/chamados/${c1.id}/status`, mudar(c1.id, 'FECHADO'));
await espera('ABERTO -> EM_ANDAMENTO', 200, 'PATCH', `/chamados/${c1.id}/status`, mudar(c1.id, 'EM_ANDAMENTO'));
await espera('Solicitante não resolve chamado (RN09)', 403, 'PATCH', `/chamados/${c1.id}/status`, mudar(c1.id, 'RESOLVIDO', sol));
await espera('EM_ANDAMENTO -> AGUARDANDO', 200, 'PATCH', `/chamados/${c1.id}/status`, mudar(c1.id, 'AGUARDANDO'));
await espera('AGUARDANDO -> EM_ANDAMENTO', 200, 'PATCH', `/chamados/${c1.id}/status`, mudar(c1.id, 'EM_ANDAMENTO'));
const h6 = (await historico(c1.id)).filter((h) => h.tipo === 'MUDANCA_STATUS');
checar('Cada mudança grava histórico com autor e data (RF08, RN05)', h6.length === 3 && h6.every((h) => h.autor?.nome && h.criadoEm), `${h6.length} registros, autor ${h6[0]?.autor?.nome}`);

// ---------- CT07: follow-up ----------
caso('CT07');
await espera('Solicitante comenta', 201, 'POST', `/chamados/${c1.id}/followups`, { token: sol, body: { conteudo: 'Continua sem imprimir.' } });
await espera('Técnico registra nota interna', 201, 'POST', `/chamados/${c1.id}/followups`, { token: tec, body: { conteudo: 'Nota interna CT', interno: true } });
const forjado = await req('POST', `/chamados/${c1.id}/followups`, { token: sol, body: { conteudo: 'Tentativa de nota interna', interno: true } });
checar('Solicitante não consegue criar nota interna', forjado.data.interno === false, `interno=${forjado.data.interno}`);
const vistoSol = await historico(c1.id, sol);
const vistoTec = await historico(c1.id, tec);
checar('Solicitante não vê a nota interna (RN12)', !vistoSol.some((h) => h.conteudo === 'Nota interna CT'), `${vistoSol.length} registros visíveis`);
checar('Técnico vê a nota interna (RN12)', vistoTec.some((h) => h.conteudo === 'Nota interna CT'), `${vistoTec.length} registros visíveis`);

// ---------- CT08: avaliação ----------
caso('CT08');
const avaliacao = { nota: 5, comentario: 'Resolvido rápido.' };
await espera('Avaliar antes da resolução é recusado (RN07)', 400, 'POST', `/chamados/${c1.id}/avaliacao`, { token: sol, body: avaliacao });
await espera('EM_ANDAMENTO -> RESOLVIDO', 200, 'PATCH', `/chamados/${c1.id}/status`, mudar(c1.id, 'RESOLVIDO'));
await espera('Técnico não avalia (RN07)', 403, 'POST', `/chamados/${c1.id}/avaliacao`, { token: tec, body: avaliacao });
await espera('Nota fora de 1 a 5 é recusada', 400, 'POST', `/chamados/${c1.id}/avaliacao`, { token: sol, body: { nota: 6 } });
await espera('Solicitante avalia', 201, 'POST', `/chamados/${c1.id}/avaliacao`, { token: sol, body: avaliacao });
await espera('Segunda avaliação é recusada', 409, 'POST', `/chamados/${c1.id}/avaliacao`, { token: sol, body: avaliacao });

// ---------- CT09: painel ----------
caso('CT09');
const painel = (await espera('Técnico consulta o painel', 200, 'GET', '/dashboard', { token: tec })).data;
checar('Painel conta 1 concluído (RN14)', painel.concluidos === 1, `concluidos=${painel.concluidos}`);
checar('Painel calcula tempo médio (RF11)', painel.tempoMedioResolucaoMin !== null, `${painel.tempoMedioResolucaoMin} min`);
checar('Painel calcula % no prazo', painel.percentualNoPrazo === 100, `${painel.percentualNoPrazo}%`);
const semDados = (await req('GET', `/dashboard?${new URLSearchParams({ ate: ontem })}`, { token: tec })).data;
checar('Período sem concluídos: indicadores zerados (RN14)', semDados.concluidos === 0 && semDados.tempoMedioResolucaoMin === null, `concluidos=${semDados.concluidos}, tempo=${semDados.tempoMedioResolucaoMin}`);

// ---------- CT10: dados do SLA (a tela é conferida à parte) ----------
caso('CT10');
const emLista = (await lista({ busca: `#${c2.numero}` }))[0];
checar('API entrega o prazo usado pelo semáforo (RF09)', !!emLista?.prazoResolucao, emLista?.prazoResolucao);
const detResolvido = (await req('GET', `/chamados/${c1.id}`, { token: tec })).data;
checar('Chamado resolvido guarda data de resolução', !!detResolvido.resolvidoEm, detResolvido.resolvidoEm);

// ---------- CT11: modo manutenção ----------
caso('CT11');
const regB = await espera('Cadastrar segunda organização', 201, 'POST', '/auth/registrar', {
  body: { organizacao: `CT Testes B ${RODADA}`, nome: 'Admin B', email: email('adminb'), senha: SENHA },
});
const adminB = regB.data.token;
await espera('Solicitante não ativa manutenção', 403, 'POST', '/manutencao', { token: sol, body: { motivo: 'Teste CT' } });
const manut = await espera('Admin ativa manutenção', 201, 'POST', '/manutencao', { token: admin, body: { motivo: 'Teste CT' } });
checar('Situação fica ativa com o motivo', manut.data.ativa && manut.data.motivo === 'Teste CT', `ativa=${manut.data.ativa}`);
await espera('Abrir chamado é bloqueado', 503, 'POST', '/chamados', { token: sol, body: novoChamado(setor.id) });
await espera('Mudar status é bloqueado', 503, 'PATCH', `/chamados/${c2.id}/status`, mudar(c2.id, 'CANCELADO', tec, { justificativa: 'x' }));
await espera('Cadastro é bloqueado', 503, 'POST', '/setores', { token: admin, body: { nome: 'Bloqueado' } });
await espera('Consulta continua liberada', 200, 'GET', '/chamados', { token: sol });
const loginManut = await login('tecnico');
checar('Login continua liberado', loginManut.status === 201, `HTTP ${loginManut.status}`);
await espera('Outra organização não é afetada', 201, 'POST', '/setores', { token: adminB, body: { nome: 'Livre' } });
await espera('Admin encerra manutenção', 200, 'DELETE', '/manutencao', { token: admin });
await espera('Escrita volta a funcionar', 201, 'POST', '/setores', { token: admin, body: { nome: 'Pos manutencao' } });

// ---------- CT12: reabertura ----------
caso('CT12');
const reabrir = { causa: 'VOLTOU_A_FALHAR', justificativa: 'A fila travou de novo.' };
await espera('Solicitante não reabre (RN13)', 403, 'PATCH', `/chamados/${c1.id}/reabrir`, { token: sol, body: reabrir });
await espera('Reabrir sem causa é recusado', 400, 'PATCH', `/chamados/${c1.id}/reabrir`, { token: tec, body: { justificativa: 'Sem causa' } });
await espera('Causa fora da lista é recusada', 400, 'PATCH', `/chamados/${c1.id}/reabrir`, { token: tec, body: { causa: 'OUTRA', justificativa: 'Causa inválida' } });
await espera('Só reabre chamado resolvido ou fechado', 400, 'PATCH', `/chamados/${c2.id}/reabrir`, { token: tec, body: reabrir });
const reaberto = (await espera('Técnico reabre com causa', 200, 'PATCH', `/chamados/${c1.id}/reabrir`, { token: tec, body: reabrir })).data;
checar('Volta para EM_ANDAMENTO sem data de resolução', reaberto.status === 'EM_ANDAMENTO' && reaberto.resolvidoEm === null, `${reaberto.status}, resolvidoEm=${reaberto.resolvidoEm}`);
const horasReaberto = horasAte(reaberto.prazoResolucao);
checar('Reabertura reaplica o prazo (RN13)', Math.abs(horasReaberto - 24) < 0.1, `${horasReaberto.toFixed(2)} h`);
const hReab = (await historico(c1.id)).find((h) => h.tipo === 'REABERTURA');
checar('Histórico guarda a causa', hReab?.causaReabertura === 'VOLTOU_A_FALHAR', hReab?.conteudo);
const rein = (await espera('Indicador de reincidência responde', 200, 'GET', '/reincidencia', { token: tec })).data;
checar('Reincidência soma por causa, categoria e técnico', rein.total === 1 && rein.porCategoria?.[0]?.reaberturas === 1 && rein.porTecnico?.[0]?.tecnicoId === tecUsuario.id, `total=${rein.total}, categoria=${rein.porCategoria?.[0]?.categoria}, técnico=${rein.porTecnico?.[0]?.nome}`);
await espera('Reincidência é restrita à equipe', 403, 'GET', '/reincidencia', { token: sol });
await req('PATCH', `/chamados/${c1.id}/status`, mudar(c1.id, 'RESOLVIDO'));
await espera('Fechar chamado resolvido (RN06)', 200, 'PATCH', `/chamados/${c1.id}/status`, mudar(c1.id, 'FECHADO'));
await espera('Chamado fechado não recebe follow-up (RN06)', 400, 'POST', `/chamados/${c1.id}/followups`, { token: tec, body: { conteudo: 'Depois de fechado' } });

// ---------- CT13: campos obrigatórios ----------
caso('CT13');
const { titulo: _t, ...semTitulo } = novoChamado(setor.id);
await espera('Sem título é recusado', 400, 'POST', '/chamados', { token: sol, body: semTitulo });
await espera('Título curto é recusado', 400, 'POST', '/chamados', { token: sol, body: novoChamado(setor.id, { titulo: 'ab' }) });
await espera('Categoria inválida é recusada', 400, 'POST', '/chamados', { token: sol, body: novoChamado(setor.id, { categoria: 'CAFE' }) });
await espera('Setor inexistente é recusado', 400, 'POST', '/chamados', { token: sol, body: novoChamado('00000000-0000-4000-8000-000000000000') });

// ---------- CT14: permissões ----------
caso('CT14');
await espera('Solicitante não cria setor', 403, 'POST', '/setores', { token: sol, body: { nome: 'Indevido' } });
await espera('Técnico não cria setor', 403, 'POST', '/setores', { token: tec, body: { nome: 'Indevido' } });
await espera('Solicitante não cria usuário', 403, 'POST', '/usuarios', { token: sol, body: { nome: 'Indevido', email: email('indevido'), senha: SENHA, perfil: 'ADMIN' } });
await espera('Solicitante não abre o painel', 403, 'GET', '/dashboard', { token: sol });
await espera('Técnico não gera demonstração', 403, 'POST', '/chamados/demo', { token: tec, body: { abertos: 1, resolvidos: 0, emAndamento: 0, resto: 0, de: '2026-01', ate: '2026-01' } });
await espera('Solicitante não abre chamado de outra pessoa', 403, 'GET', `/chamados/${c3.id}`, { token: sol });

// ---------- CT15: cancelamento ----------
caso('CT15');
await espera('Cancelar sem justificativa é recusado (RN10)', 400, 'PATCH', `/chamados/${c2.id}/status`, mudar(c2.id, 'CANCELADO', sol));
await espera('Justificativa só com espaços é recusada (RN10)', 400, 'PATCH', `/chamados/${c2.id}/status`, mudar(c2.id, 'CANCELADO', sol, { justificativa: '   ' }));
await espera('Solicitante não cancela chamado de outra pessoa', 403, 'PATCH', `/chamados/${c3.id}/status`, mudar(c3.id, 'CANCELADO', sol, { justificativa: 'Indevido' }));
await espera('Solicitante cancela com justificativa (RF16)', 200, 'PATCH', `/chamados/${c2.id}/status`, mudar(c2.id, 'CANCELADO', sol, { justificativa: 'Problema resolvido sozinho' }));
const hCanc = (await historico(c2.id)).find((h) => h.tipo === 'CANCELAMENTO');
checar('Justificativa fica no histórico', hCanc?.conteudo?.includes('Problema resolvido sozinho'), hCanc?.conteudo);
await espera('Chamado fechado não é cancelado (RN10)', 400, 'PATCH', `/chamados/${c1.id}/status`, mudar(c1.id, 'CANCELADO', tec, { justificativa: 'Tarde demais' }));

// ---------- CT16: isolamento entre organizações ----------
caso('CT16');
await espera('Outra organização não abre o chamado', 404, 'GET', `/chamados/${c1.id}`, { token: adminB });
const listaB = (await req('GET', '/chamados', { token: adminB })).data;
checar('Outra organização não lista o chamado (RNF08)', listaB.length === 0, `${listaB.length} chamado(s)`);

// ---------- CT17: inativação ----------
caso('CT17');
await espera('Setor não tem rota de exclusão (RN11)', 404, 'DELETE', `/setores/${setor.id}`, { token: admin });
const setorInativo = (await espera('Admin inativa setor', 200, 'PATCH', `/setores/${setor.id}/ativo`, { token: admin })).data;
checar('Setor fica inativo', setorInativo.ativo === false, `ativo=${setorInativo.ativo}`);
await espera('Setor inativo não recebe chamado', 400, 'POST', '/chamados', { token: sol, body: novoChamado(setor.id) });
await req('PATCH', `/setores/${setor.id}/ativo`, { token: admin });
await espera('Admin inativa usuário', 200, 'PATCH', `/usuarios/${sol2Usuario.id}/ativo`, { token: admin });
await espera('Token do usuário inativado deixa de valer', 401, 'GET', '/chamados', { token: sol2 });

// ---------- CT18: dados de demonstração ----------
caso('CT18');
const demo = await espera('Admin gera demonstração', 201, 'POST', '/chamados/demo', { token: admin, body: { abertos: 2, resolvidos: 2, emAndamento: 1, resto: 0, de: '2026-11', ate: '2026-11' } });
checar('Cria a quantidade pedida', demo.data.criados === 5, `criados=${demo.data.criados}`);
const comDemo = await lista({ busca: '[Demo]' }, admin);
checar('Chamado de demonstração não tem prazo de SLA', comDemo.every((c) => c.prazoResolucao === null), `${comDemo.length} sem prazo`);
const removidos = (await espera('Admin apaga a demonstração', 200, 'DELETE', '/chamados/demo', { token: admin })).data;
checar('Apaga só os chamados de demonstração', removidos.removidos === 5, `removidos=${removidos.removidos}`);
await espera('Chamado real continua existindo', 200, 'GET', `/chamados/${c3.id}`, { token: tec });

// ---------- CT19: limite de tentativas ----------
caso('CT19');
await esperarJanelaDeLogin();
const loginInativo = await login('solicitante2');
checar('Usuário inativado não faz login', loginInativo.status === 401, `HTTP ${loginInativo.status}`);
const codigos = [loginInativo.status];
for (let i = 0; i < 5; i++) codigos.push((await login('tecnico')).status);
checar('Sexta tentativa no minuto recebe 429', codigos.slice(0, 5).every((c) => c !== 429) && codigos[5] === 429, codigos.join(','));
const meLivre = [];
for (let i = 0; i < 10; i++) meLivre.push((await req('GET', '/auth/me', { token: tec })).status);
checar('/auth/me fica fora do limite', meLivre.every((c) => c === 200), `10 chamadas: ${[...new Set(meLivre)].join(',')}`);

const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - falhas.length}/${resultados.length} verificações ok`);
if (SAIDA) {
  writeFileSync(SAIDA, JSON.stringify({ executadoEm: new Date(RODADA).toISOString(), api: API, resultados }, null, 2) + '\n');
}
process.exit(falhas.length ? 1 : 0);
