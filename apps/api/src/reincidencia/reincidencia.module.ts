import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { CausaReabertura, Categoria, Perfil, TipoHistorico } from '@prisma/client';
import { CurrentUser, Roles, UsuarioLogado } from '../common/auth';
import { PrismaService } from '../prisma/prisma.service';

interface Grupo {
  reaberturas: number;
  /** Chamados distintos reabertos ao menos uma vez. */
  reabertos: Set<string>;
  /** Chamados que chegaram a ser resolvidos (base da taxa). */
  base: Set<string>;
}

const novoGrupo = (): Grupo => ({ reaberturas: 0, reabertos: new Set(), base: new Set() });

function resumir(g: Grupo) {
  return {
    reaberturas: g.reaberturas,
    reabertos: g.reabertos.size,
    resolvidos: g.base.size,
    taxa: g.base.size ? Math.round((g.reabertos.size / g.base.size) * 100) : 0,
  };
}

/**
 * Reincidência: quantos chamados resolvidos voltaram a ser reabertos,
 * por categoria e por técnico. Só leitura, sobre o histórico de REABERTURA.
 */
@Injectable()
class ReincidenciaService {
  constructor(private readonly prisma: PrismaService) {}

  async resumo(user: UsuarioLogado) {
    const org = user.organizacaoId;
    const [chamados, reaberturas] = await Promise.all([
      this.prisma.chamado.findMany({
        where: { organizacaoId: org },
        select: { id: true, categoria: true, tecnicoId: true, resolvidoEm: true },
      }),
      this.prisma.historicoChamado.findMany({
        where: { tipo: TipoHistorico.REABERTURA, chamado: { organizacaoId: org } },
        select: {
          chamadoId: true,
          causaReabertura: true,
          tecnicoResponsavelId: true,
          chamado: { select: { categoria: true, tecnicoId: true } },
        },
      }),
    ]);

    const porCategoria = new Map<Categoria, Grupo>();
    const porTecnico = new Map<string, Grupo>();
    const porCausa = new Map<CausaReabertura, number>();
    const grupo = <K>(m: Map<K, Grupo>, k: K) => m.get(k) ?? m.set(k, novoGrupo()).get(k)!;

    // base: chamados resolvidos agora + os que foram reabertos (já tinham sido resolvidos)
    for (const c of chamados) {
      if (!c.resolvidoEm) continue;
      grupo(porCategoria, c.categoria).base.add(c.id);
      if (c.tecnicoId) grupo(porTecnico, c.tecnicoId).base.add(c.id);
    }

    for (const r of reaberturas) {
      // reaberturas antigas (antes da causa) não têm o técnico guardado: usa o atual
      const tecnicoId = r.tecnicoResponsavelId ?? r.chamado.tecnicoId;
      const cat = grupo(porCategoria, r.chamado.categoria);
      cat.reaberturas++;
      cat.reabertos.add(r.chamadoId);
      cat.base.add(r.chamadoId);
      if (tecnicoId) {
        const tec = grupo(porTecnico, tecnicoId);
        tec.reaberturas++;
        tec.reabertos.add(r.chamadoId);
        tec.base.add(r.chamadoId);
      }
      if (r.causaReabertura) porCausa.set(r.causaReabertura, (porCausa.get(r.causaReabertura) ?? 0) + 1);
    }

    const nomes = await this.prisma.usuario.findMany({
      where: { organizacaoId: org, id: { in: [...porTecnico.keys()] } },
      select: { id: true, nome: true },
    });
    const nome = new Map(nomes.map((u) => [u.id, u.nome]));
    const maiorTaxa = (a: { taxa: number; reaberturas: number }, b: { taxa: number; reaberturas: number }) =>
      b.taxa - a.taxa || b.reaberturas - a.reaberturas;

    return {
      total: reaberturas.length,
      porCausa: [...porCausa].map(([causa, total]) => ({ causa, total })),
      porCategoria: [...porCategoria]
        .map(([categoria, g]) => ({ categoria, ...resumir(g) }))
        .sort(maiorTaxa),
      porTecnico: [...porTecnico]
        .map(([tecnicoId, g]) => ({ tecnicoId, nome: nome.get(tecnicoId) ?? '—', ...resumir(g) }))
        .sort(maiorTaxa),
    };
  }
}

@Controller('reincidencia')
class ReincidenciaController {
  constructor(private readonly service: ReincidenciaService) {}

  // mesmo acesso do painel (RN09)
  @Roles(Perfil.TECNICO, Perfil.ADMIN)
  @Get()
  resumo(@CurrentUser() user: UsuarioLogado) {
    return this.service.resumo(user);
  }
}

@Module({ controllers: [ReincidenciaController], providers: [ReincidenciaService] })
export class ReincidenciaModule {}
