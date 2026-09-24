import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Perfil, Prisma, StatusChamado, TipoHistorico } from '@prisma/client';
import { UsuarioLogado } from '../common/auth';
import { PrismaService } from '../prisma/prisma.service';
import {
  AtribuirDto,
  AvaliarDto,
  CriarChamadoDto,
  FiltroChamadosDto,
  FollowUpDto,
  MudarStatusDto,
  ReabrirDto,
} from './chamados.dto';

const { ABERTO, EM_ANDAMENTO, AGUARDANDO, RESOLVIDO, FECHADO, CANCELADO } = StatusChamado;

/** RN04: transições válidas de status. */
const TRANSICOES: Record<StatusChamado, StatusChamado[]> = {
  ABERTO: [EM_ANDAMENTO, CANCELADO],
  EM_ANDAMENTO: [AGUARDANDO, RESOLVIDO, CANCELADO],
  AGUARDANDO: [EM_ANDAMENTO, RESOLVIDO, CANCELADO],
  RESOLVIDO: [FECHADO],
  FECHADO: [],
  CANCELADO: [],
};

const equipe = (u: UsuarioLogado) => u.perfil === Perfil.TECNICO || u.perfil === Perfil.ADMIN;

@Injectable()
export class ChamadosService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- consulta (RF12) ----------

  async listar(user: UsuarioLogado, f: FiltroChamadosDto) {
    const where: Prisma.ChamadoWhereInput = {
      organizacaoId: user.organizacaoId,
      // RN09: solicitante só enxerga os próprios chamados
      ...(equipe(user) ? {} : { solicitanteId: user.id }),
      ...(f.status && { status: f.status }),
      ...(f.prioridade && { prioridade: f.prioridade }),
      ...(f.categoria && { categoria: f.categoria }),
      ...(f.tecnicoId && { tecnicoId: f.tecnicoId }),
      ...(f.setorId && { setorId: f.setorId }),
      ...(f.solicitanteId && equipe(user) && { solicitanteId: f.solicitanteId }),
      ...((f.de || f.ate) && {
        abertoEm: {
          ...(f.de && { gte: new Date(f.de) }),
          ...(f.ate && { lte: new Date(f.ate) }),
        },
      }),
    };
    if (f.busca) {
      const n = Number(f.busca.replace('#', ''));
      where.OR = [
        { titulo: { contains: f.busca, mode: 'insensitive' } },
        { descricao: { contains: f.busca, mode: 'insensitive' } },
        ...(Number.isInteger(n) ? [{ numero: n }] : []),
      ];
    }
    return this.prisma.chamado.findMany({
      where,
      orderBy: { abertoEm: 'desc' },
      take: 200,
      include: this.resumo,
    });
  }

  async buscar(user: UsuarioLogado, id: string) {
    const chamado = await this.prisma.chamado.findFirst({
      where: { id, organizacaoId: user.organizacaoId },
      include: {
        ...this.resumo,
        avaliacao: true,
        anexos: true,
        historico: {
          // RN12: follow-ups internos só para técnicos e administradores
          where: equipe(user) ? {} : { interno: false },
          orderBy: { criadoEm: 'asc' },
          include: { autor: { select: { id: true, nome: true, perfil: true } } },
        },
      },
    });
    if (!chamado) throw new NotFoundException('Chamado não encontrado');
    this.garantirAcesso(user, chamado.solicitanteId);
    return chamado;
  }

  // ---------- abertura (RF05, RN01, RN02, RN08) ----------

  async criar(user: UsuarioLogado, dto: CriarChamadoDto) {
    const setor = await this.prisma.setor.findFirst({
      where: { id: dto.setorId, organizacaoId: user.organizacaoId, ativo: true },
    });
    if (!setor) throw new BadRequestException('Setor inválido');

    if (dto.equipamentoId) {
      const eq = await this.prisma.equipamento.findFirst({
        where: { id: dto.equipamentoId, organizacaoId: user.organizacaoId, ativo: true },
      });
      // RN08: equipamento deve pertencer ao setor ou ao usuário do chamado
      if (!eq || (eq.setorId !== dto.setorId && eq.usuarioId !== user.id)) {
        throw new BadRequestException('Equipamento não pertence ao setor ou ao solicitante');
      }
    }

    const prazo = await this.calcularPrazo(user.organizacaoId, dto.prioridade);
    return this.prisma.chamado.create({
      data: {
        organizacaoId: user.organizacaoId,
        solicitanteId: user.id,
        setorId: dto.setorId,
        equipamentoId: dto.equipamentoId,
        titulo: dto.titulo.trim(),
        descricao: dto.descricao.trim(),
        categoria: dto.categoria,
        prioridade: dto.prioridade,
        status: ABERTO,
        prazoResolucao: prazo,
        historico: {
          create: { autorId: user.id, tipo: TipoHistorico.CRIACAO, conteudo: 'Chamado aberto' },
        },
      },
      include: this.resumo,
    });
  }

  // ---------- encaminhamento (RF07, RN03) ----------

  async atribuir(user: UsuarioLogado, id: string, dto: AtribuirDto) {
    const chamado = await this.carregar(user, id);
    this.garantirEditavel(chamado.status);

    const tecnico = await this.prisma.usuario.findFirst({
      where: {
        id: dto.tecnicoId,
        organizacaoId: user.organizacaoId,
        ativo: true,
        perfil: { in: [Perfil.TECNICO, Perfil.ADMIN] },
      },
    });
    if (!tecnico) throw new BadRequestException('Técnico inválido');

    return this.prisma.chamado.update({
      where: { id },
      data: {
        tecnicoId: tecnico.id,
        historico: {
          create: {
            autorId: user.id,
            tipo: TipoHistorico.ATRIBUICAO,
            conteudo: chamado.tecnicoId
              ? `Reatribuído para ${tecnico.nome}`
              : `Atribuído a ${tecnico.nome}`,
          },
        },
      },
      include: this.resumo,
    });
  }

  // ---------- status (RF09, RN03, RN04, RN06, RN10) ----------

  async mudarStatus(user: UsuarioLogado, id: string, dto: MudarStatusDto) {
    const chamado = await this.carregar(user, id);
    const novo = dto.status;

    if (!TRANSICOES[chamado.status].includes(novo)) {
      throw new BadRequestException(`Transição inválida: ${chamado.status} → ${novo}`);
    }

    // Solicitante só pode cancelar ou fechar o próprio chamado (RN09)
    if (!equipe(user)) {
      if (chamado.solicitanteId !== user.id) throw new ForbiddenException();
      if (novo !== CANCELADO && novo !== FECHADO) {
        throw new ForbiddenException('Apenas a equipe de TI pode alterar este status');
      }
    }

    // RN03: o atendimento só inicia com técnico responsável
    if (novo === EM_ANDAMENTO && !chamado.tecnicoId) {
      throw new BadRequestException('Atribua um técnico antes de iniciar o atendimento');
    }
    // RN10: cancelamento exige justificativa
    if (novo === CANCELADO && !dto.justificativa?.trim()) {
      throw new BadRequestException('Informe a justificativa do cancelamento');
    }

    const agora = new Date();
    return this.prisma.chamado.update({
      where: { id },
      data: {
        status: novo,
        ...(novo === RESOLVIDO && { resolvidoEm: agora }),
        ...(novo === FECHADO && { fechadoEm: agora }),
        historico: {
          create: {
            autorId: user.id,
            tipo: novo === CANCELADO ? TipoHistorico.CANCELAMENTO : TipoHistorico.MUDANCA_STATUS,
            conteudo:
              `Status: ${chamado.status} → ${novo}` +
              (dto.justificativa ? ` (${dto.justificativa.trim()})` : ''),
          },
        },
      },
      include: this.resumo,
    });
  }

  /** RN13: técnico ou admin reabrem; gera histórico e recalcula o prazo. */
  async reabrir(user: UsuarioLogado, id: string, dto: ReabrirDto) {
    const chamado = await this.carregar(user, id);
    if (chamado.status !== RESOLVIDO && chamado.status !== FECHADO) {
      throw new BadRequestException('Só é possível reabrir chamados resolvidos ou fechados');
    }
    const prazo = await this.calcularPrazo(user.organizacaoId, chamado.prioridade);
    return this.prisma.chamado.update({
      where: { id },
      data: {
        status: EM_ANDAMENTO,
        resolvidoEm: null,
        fechadoEm: null,
        prazoResolucao: prazo,
        historico: {
          create: {
            autorId: user.id,
            tipo: TipoHistorico.REABERTURA,
            conteudo: `Reaberto: ${dto.justificativa.trim()}`,
          },
        },
      },
      include: this.resumo,
    });
  }

  // ---------- histórico (RF08, RN12) ----------

  async followUp(user: UsuarioLogado, id: string, dto: FollowUpDto) {
    const chamado = await this.carregar(user, id);
    this.garantirAcesso(user, chamado.solicitanteId);
    this.garantirEditavel(chamado.status);
    return this.prisma.historicoChamado.create({
      data: {
        chamadoId: id,
        autorId: user.id,
        tipo: TipoHistorico.FOLLOWUP,
        conteudo: dto.conteudo.trim(),
        interno: equipe(user) ? !!dto.interno : false,
      },
      include: { autor: { select: { id: true, nome: true, perfil: true } } },
    });
  }

  // ---------- avaliação (RF10, RN07) ----------

  async avaliar(user: UsuarioLogado, id: string, dto: AvaliarDto) {
    const chamado = await this.carregar(user, id);
    if (chamado.solicitanteId !== user.id) {
      throw new ForbiddenException('Apenas o solicitante pode avaliar');
    }
    if (chamado.status !== RESOLVIDO && chamado.status !== FECHADO) {
      throw new BadRequestException('Só é possível avaliar após a resolução');
    }
    const existente = await this.prisma.avaliacao.findUnique({ where: { chamadoId: id } });
    if (existente) throw new ConflictException('Chamado já avaliado');
    return this.prisma.avaliacao.create({
      data: { chamadoId: id, nota: dto.nota, comentario: dto.comentario?.trim() },
    });
  }

  // ---------- helpers ----------

  private readonly resumo = {
    solicitante: { select: { id: true, nome: true } },
    tecnico: { select: { id: true, nome: true } },
    setor: { select: { id: true, nome: true } },
    equipamento: { select: { id: true, nome: true } },
  } satisfies Prisma.ChamadoInclude;

  private async carregar(user: UsuarioLogado, id: string) {
    const chamado = await this.prisma.chamado.findFirst({
      where: { id, organizacaoId: user.organizacaoId },
    });
    if (!chamado) throw new NotFoundException('Chamado não encontrado');
    return chamado;
  }

  private garantirAcesso(user: UsuarioLogado, solicitanteId: string) {
    if (!equipe(user) && solicitanteId !== user.id) {
      throw new ForbiddenException('Sem acesso a este chamado');
    }
  }

  /** RN06: fechado/cancelado não edita (exceto reabertura autorizada). */
  private garantirEditavel(status: StatusChamado) {
    if (status === FECHADO || status === CANCELADO) {
      throw new BadRequestException('Chamado encerrado não pode ser alterado');
    }
  }

  private async calcularPrazo(organizacaoId: string, prioridade: CriarChamadoDto['prioridade']) {
    const sla = await this.prisma.sla.findUnique({
      where: { organizacaoId_prioridade: { organizacaoId, prioridade } },
    });
    return sla ? new Date(Date.now() + sla.minutosResolucao * 60_000) : null;
  }
}
