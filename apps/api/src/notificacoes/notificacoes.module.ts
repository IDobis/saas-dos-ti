import { Controller, Get, Injectable, Module, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { CurrentUser, UsuarioLogado } from '../common/auth';
import { LiberadoEmManutencao } from '../manutencao/manutencao.module';
import { PrismaService } from '../prisma/prisma.service';

/** Minúsculas e sem acento, para "@joao" achar "João". */
const normalizar = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Quais candidatos foram mencionados no texto, por nome completo ("@Maria Silva")
 * ou só pelo primeiro nome ("@Maria"). O @ precisa começar uma palavra (e-mail não conta)
 * e a menção termina onde acaba a palavra ("@Mariana" não é "@Maria").
 */
export function mencionados<T extends { nome: string }>(texto: string, candidatos: T[]): T[] {
  const t = normalizar(texto);
  return candidatos.filter((c) => {
    const nome = normalizar(c.nome.trim());
    const primeiro = nome.split(/\s+/)[0];
    return [nome, primeiro].some((n) => new RegExp(`(?<![\\p{L}\\p{N}])@${escapar(n)}(?![\\p{L}\\p{N}])`, 'u').test(t));
  });
}

@Injectable()
class NotificacoesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(user: UsuarioLogado) {
    const [naoLidas, itens] = await Promise.all([
      this.prisma.notificacao.count({ where: { usuarioId: user.id, lidaEm: null } }),
      this.prisma.notificacao.findMany({
        where: { usuarioId: user.id },
        orderBy: { criadoEm: 'desc' },
        take: 20,
        select: {
          id: true,
          lidaEm: true,
          criadoEm: true,
          historico: {
            select: {
              conteudo: true,
              autor: { select: { nome: true } },
              chamado: { select: { id: true, numero: true, titulo: true, status: true } },
            },
          },
        },
      }),
    ]);
    return { naoLidas, itens };
  }

  async marcarLida(user: UsuarioLogado, id: string) {
    // updateMany com usuarioId: ninguém marca o aviso de outra pessoa
    await this.prisma.notificacao.updateMany({
      where: { id, usuarioId: user.id, lidaEm: null },
      data: { lidaEm: new Date() },
    });
    return this.listar(user);
  }

  async marcarTodas(user: UsuarioLogado) {
    await this.prisma.notificacao.updateMany({
      where: { usuarioId: user.id, lidaEm: null },
      data: { lidaEm: new Date() },
    });
    return this.listar(user);
  }
}

// Marcar como lido não altera chamados, então segue liberado em manutenção
@Controller('notificacoes')
class NotificacoesController {
  constructor(private readonly service: NotificacoesService) {}

  @Get()
  listar(@CurrentUser() user: UsuarioLogado) {
    return this.service.listar(user);
  }

  @LiberadoEmManutencao()
  @Patch('lidas')
  marcarTodas(@CurrentUser() user: UsuarioLogado) {
    return this.service.marcarTodas(user);
  }

  @LiberadoEmManutencao()
  @Patch(':id/lida')
  marcarLida(@CurrentUser() user: UsuarioLogado, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.marcarLida(user, id);
  }
}

@Module({ controllers: [NotificacoesController], providers: [NotificacoesService] })
export class NotificacoesModule {}
