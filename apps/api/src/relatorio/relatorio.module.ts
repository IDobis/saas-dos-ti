import { Controller, Get, Injectable, Module, Query } from '@nestjs/common';
import { Perfil, StatusChamado } from '@prisma/client';
import { IsString, Matches } from 'class-validator';
import { CurrentUser, Roles, UsuarioLogado } from '../common/auth';
import { PrismaService } from '../prisma/prisma.service';

class FiltroRelatorioDto {
  /** Mês inicial, no formato AAAA-MM. */
  @IsString() @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  de!: string;

  /** Mês final (inclusive), no formato AAAA-MM. */
  @IsString() @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  ate!: string;
}

function inicioDoMes(anoMes: string) {
  const [ano, mes] = anoMes.split('-').map(Number);
  return new Date(ano, mes - 1, 1);
}

/** Primeiro instante do mês seguinte (limite exclusivo). */
function fimDoMes(anoMes: string) {
  const [ano, mes] = anoMes.split('-').map(Number);
  return new Date(ano, mes, 1);
}

/**
 * Relatório do período para exportar (CSV/PDF no front).
 * Só leitura: reúne volume por status, tempo médio, avaliações e chamados estourados.
 */
@Injectable()
class RelatorioService {
  constructor(private readonly prisma: PrismaService) {}

  async gerar(user: UsuarioLogado, f: FiltroRelatorioDto) {
    // aceita o período invertido em vez de devolver vazio
    const [de, ate] = f.de <= f.ate ? [f.de, f.ate] : [f.ate, f.de];
    const org = user.organizacaoId;
    const abertoNoPeriodo = { gte: inicioDoMes(de), lt: fimDoMes(ate) };
    const agora = new Date();

    const [organizacao, autor, porStatus, resolvidos, avaliacoes, comPrazo] = await Promise.all([
      this.prisma.organizacao.findUniqueOrThrow({ where: { id: org }, select: { nome: true } }),
      this.prisma.usuario.findUniqueOrThrow({ where: { id: user.id }, select: { nome: true } }),
      this.prisma.chamado.groupBy({
        by: ['status'],
        where: { organizacaoId: org, abertoEm: abertoNoPeriodo },
        _count: true,
      }),
      // RN14: tempo médio e prazo contam os chamados concluídos no período
      this.prisma.chamado.findMany({
        where: { organizacaoId: org, resolvidoEm: abertoNoPeriodo },
        select: { abertoEm: true, resolvidoEm: true, prazoResolucao: true },
      }),
      this.prisma.avaliacao.findMany({
        where: { criadoEm: abertoNoPeriodo, chamado: { organizacaoId: org } },
        select: { nota: true },
      }),
      this.prisma.chamado.findMany({
        where: {
          organizacaoId: org,
          abertoEm: abertoNoPeriodo,
          prazoResolucao: { not: null },
          status: { not: StatusChamado.CANCELADO },
        },
        orderBy: { prazoResolucao: 'asc' },
        select: {
          numero: true,
          titulo: true,
          prioridade: true,
          categoria: true,
          status: true,
          prazoResolucao: true,
          resolvidoEm: true,
          tecnico: { select: { nome: true } },
        },
      }),
    ]);

    const tempos = resolvidos.map((c) => c.resolvidoEm!.getTime() - c.abertoEm.getTime());
    const noPrazo = resolvidos.filter((c) => !c.prazoResolucao || c.resolvidoEm! <= c.prazoResolucao).length;

    // Estourado: resolvido depois do prazo, ou ainda em aberto com o prazo vencido
    const estourados = comPrazo
      .map((c) => {
        const fim = c.resolvidoEm ?? agora;
        return { ...c, tecnico: c.tecnico?.nome ?? null, atrasoMin: Math.round((fim.getTime() - c.prazoResolucao!.getTime()) / 60_000) };
      })
      .filter((c) => c.atrasoMin > 0);

    const notas = [1, 2, 3, 4, 5].map((nota) => ({ nota, total: avaliacoes.filter((a) => a.nota === nota).length }));

    return {
      organizacao: organizacao.nome,
      geradoPor: autor.nome,
      geradoEm: agora,
      de,
      ate,
      totalAbertos: porStatus.reduce((s, x) => s + x._count, 0),
      porStatus: porStatus.map((x) => ({ status: x.status, total: x._count })),
      concluidos: resolvidos.length,
      tempoMedioResolucaoMin: tempos.length
        ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length / 60_000)
        : null,
      percentualNoPrazo: resolvidos.length ? Math.round((noPrazo / resolvidos.length) * 100) : null,
      avaliacoes: {
        total: avaliacoes.length,
        media: avaliacoes.length
          ? Math.round((avaliacoes.reduce((s, a) => s + a.nota, 0) / avaliacoes.length) * 10) / 10
          : null,
        notas,
      },
      estourados,
    };
  }
}

@Controller('relatorio')
class RelatorioController {
  constructor(private readonly service: RelatorioService) {}

  // mesmo acesso do painel (RN09)
  @Roles(Perfil.TECNICO, Perfil.ADMIN)
  @Get()
  gerar(@CurrentUser() user: UsuarioLogado, @Query() filtro: FiltroRelatorioDto) {
    return this.service.gerar(user, filtro);
  }
}

@Module({ controllers: [RelatorioController], providers: [RelatorioService] })
export class RelatorioModule {}
