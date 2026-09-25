import { Controller, Get, Injectable, Module, Query } from '@nestjs/common';
import { Perfil, StatusChamado } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';
import { CurrentUser, Roles, UsuarioLogado } from '../common/auth';
import { PrismaService } from '../prisma/prisma.service';

class FiltroPainelDto {
  @IsOptional() @IsString()
  de?: string;

  @IsOptional() @IsString()
  ate?: string;

  /** Ano do primeiro gráfico. */
  @IsOptional() @IsString()
  ano?: string;
}

@Injectable()
class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async resumo(user: UsuarioLogado, f: FiltroPainelDto) {
    const org = user.organizacaoId;
    const periodo = (campo: 'abertoEm' | 'resolvidoEm') =>
      f.de || f.ate
        ? { [campo]: { ...(f.de && { gte: new Date(f.de) }), ...(f.ate && { lte: new Date(f.ate) }) } }
        : {};

    const [porStatus, porCategoria, concluidos, chamados] = await Promise.all([
      this.prisma.chamado.groupBy({
        by: ['status'],
        where: { organizacaoId: org, ...periodo('abertoEm') },
        _count: true,
      }),
      this.prisma.chamado.groupBy({
        by: ['categoria'],
        where: { organizacaoId: org, ...periodo('abertoEm') },
        _count: true,
      }),
      // RN14: volume e tempo médio consideram apenas chamados concluídos no filtro
      this.prisma.chamado.findMany({
        where: { organizacaoId: org, resolvidoEm: { not: null }, ...periodo('resolvidoEm') },
        select: { abertoEm: true, resolvidoEm: true, prazoResolucao: true },
      }),
      this.prisma.chamado.findMany({
        where: { organizacaoId: org, ...periodo('abertoEm') },
        select: { abertoEm: true, status: true },
      }),
    ]);

    const contar = (s: StatusChamado) => porStatus.find((x) => x.status === s)?._count ?? 0;
    const tempos = concluidos.map((c) => c.resolvidoEm!.getTime() - c.abertoEm.getTime());
    const noPrazo = concluidos.filter((c) => !c.prazoResolucao || c.resolvidoEm! <= c.prazoResolucao).length;

    const rotulo: Record<StatusChamado, string> = {
      ABERTO: 'Aberto',
      EM_ANDAMENTO: 'Em andamento',
      AGUARDANDO: 'Aguardando',
      RESOLVIDO: 'Resolvido',
      FECHADO: 'Fechado',
      CANCELADO: 'Cancelado',
    };
    const ordem = Object.keys(rotulo) as StatusChamado[];
    const anoAtual = new Date().getFullYear();
    const anos = [...new Set(chamados.map((c) => c.abertoEm.getFullYear()))];
    if (!anos.includes(anoAtual)) anos.push(anoAtual);
    anos.sort((a, b) => a - b);
    const ano = Number(f.ano);
    const anoFiltro = anos.includes(ano) ? ano : anoAtual;
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const semana = meses.map((nome, mes) => {
      const doMes = chamados.filter((c) => c.abertoEm.getFullYear() === anoFiltro && c.abertoEm.getMonth() === mes);
      const ponto: Record<string, string | number> = { dia: nome };
      for (const status of ordem) ponto[rotulo[status]] = doMes.filter((c) => c.status === status).length;
      return ponto;
    });

    return {
      abertos: contar('ABERTO') + contar('EM_ANDAMENTO') + contar('AGUARDANDO'),
      concluidos: concluidos.length,
      tempoMedioResolucaoMin: tempos.length
        ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length / 60_000)
        : null,
      percentualNoPrazo: concluidos.length ? Math.round((noPrazo / concluidos.length) * 100) : null,
      porStatus: porStatus.map((x) => ({ status: x.status, total: x._count })),
      porCategoria: porCategoria.map((x) => ({ categoria: x.categoria, total: x._count })),
      anos,
      ano: anoFiltro,
      semana,
    };
  }
}

@Controller('dashboard')
class DashboardController {
  constructor(private readonly service: DashboardService) {}

  // RN09: painel é da equipe (técnico e admin)
  @Roles(Perfil.TECNICO, Perfil.ADMIN)
  @Get()
  resumo(@CurrentUser() user: UsuarioLogado, @Query() filtro: FiltroPainelDto) {
    return this.service.resumo(user, filtro);
  }
}

@Module({ controllers: [DashboardController], providers: [DashboardService] })
export class DashboardModule {}
