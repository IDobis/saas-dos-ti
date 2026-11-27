import {
  CallHandler,
  Controller,
  ExecutionContext,
  Get,
  Injectable,
  Logger,
  Module,
  NestInterceptor,
  Query,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Perfil, Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Observable, tap } from 'rxjs';
import { CurrentUser, Roles, UsuarioLogado } from '../common/auth';
import { PrismaService } from '../prisma/prisma.service';

/** Ações registradas no log; rota fora daqui (ex.: marcar notificação lida) não é registrada. */
const ACOES: Record<string, string> = {
  'POST /auth/registrar': 'Organização registrada',
  'POST /auth/login': 'Login',
  'POST /chamados': 'Chamado aberto',
  'POST /chamados/demo': 'Dados de demonstração gerados',
  'DELETE /chamados/demo': 'Dados de demonstração removidos',
  'POST /chamados/pegar-proximo': 'Chamado pego da fila',
  'PATCH /chamados/:id/atribuir': 'Técnico atribuído',
  'PATCH /chamados/:id/status': 'Status alterado',
  'PATCH /chamados/:id/reabrir': 'Chamado reaberto',
  'POST /chamados/:id/followups': 'Comentário adicionado',
  'POST /chamados/:id/avaliacao': 'Chamado avaliado',
  'POST /setores': 'Setor criado',
  'PATCH /setores/:id/ativo': 'Setor ativado/inativado',
  'POST /usuarios': 'Usuário cadastrado',
  'PATCH /usuarios/:id/ativo': 'Usuário ativado/inativado',
  'POST /manutencao': 'Modo manutenção ativado',
  'DELETE /manutencao': 'Modo manutenção desativado',
};

const ROTULOS: Record<string, string> = {
  ABERTO: 'Aberto',
  EM_ANDAMENTO: 'Em andamento',
  AGUARDANDO: 'Aguardando',
  RESOLVIDO: 'Resolvido',
  FECHADO: 'Fechado',
  CANCELADO: 'Cancelado',
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
  HARDWARE: 'Hardware',
  SOFTWARE: 'Software',
  REDE: 'Rede',
  ACESSO: 'Acesso',
  OUTROS: 'Outros',
  VOLTOU_A_FALHAR: 'Voltou a falhar',
  SOLUCAO_INCOMPLETA: 'Solução incompleta',
  USUARIO_NAO_VALIDOU: 'Usuário não validou',
  SOLICITANTE: 'Solicitante',
  TECNICO: 'Técnico',
  ADMIN: 'Administrador',
};
const rotulo = (v: string) => ROTULOS[v] ?? v;

/**
 * Monta o detalhe a partir da resposta e do corpo já validado.
 * Lista fechada por rota: senha e texto de comentários nunca vão para o log.
 */
export function detalhar(rota: string, res: any, body: any, numero?: number): string | null {
  const chamado = numero ? `#${numero}` : null;
  const ativo = () => (res.ativo ? 'ativado' : 'inativado');
  const partes: Record<string, () => unknown[]> = {
    'POST /auth/registrar': () => [body.organizacao, res.usuario.email],
    'POST /auth/login': () => [res.usuario.email, rotulo(res.usuario.perfil)],
    'POST /chamados': () => [
      chamado,
      res.titulo,
      `Prioridade: ${rotulo(res.prioridade)}`,
      `Categoria: ${rotulo(res.categoria)}`,
      `Setor: ${res.setor.nome}`,
    ],
    'POST /chamados/demo': () => [`${res.criados} chamados criados`, `Período: ${body.de} a ${body.ate}`],
    'DELETE /chamados/demo': () => [`${res.removidos} chamados removidos`],
    'POST /chamados/pegar-proximo': () => [chamado, res.titulo],
    'PATCH /chamados/:id/atribuir': () => [chamado, res.titulo, `Técnico: ${res.tecnico.nome}`],
    'PATCH /chamados/:id/status': () => [
      chamado,
      res.titulo,
      `Novo status: ${rotulo(res.status)}`,
      body.justificativa && `Justificativa: ${body.justificativa}`,
    ],
    'PATCH /chamados/:id/reabrir': () => [
      chamado,
      res.titulo,
      `Causa: ${rotulo(body.causa)}`,
      `Justificativa: ${body.justificativa}`,
    ],
    'POST /chamados/:id/followups': () => [chamado],
    'POST /chamados/:id/avaliacao': () => [chamado, `Nota: ${res.nota} de 5`],
    'POST /setores': () => [res.nome],
    'PATCH /setores/:id/ativo': () => [res.nome, ativo()],
    'POST /usuarios': () => [res.nome, res.email, rotulo(res.perfil), res.setor && `Setor: ${res.setor.nome}`],
    'PATCH /usuarios/:id/ativo': () => [res.nome, res.email, ativo()],
    'POST /manutencao': () => [
      `Motivo: ${res.motivo}`,
      res.previsao && `Previsão: ${new Date(res.previsao).toLocaleString('pt-BR')}`,
    ],
  };
  return partes[rota]?.().filter(Boolean).join(' · ') || null;
}

/** Grava no Log cada ação da tabela ACOES que terminou com sucesso. */
@Injectable()
class LogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Log');

  constructor(private readonly prisma: PrismaService) {}

  private async gravar(rota: string, acao: string, user: Partial<UsuarioLogado>, res: any, req: any) {
    let numero: number | undefined = res?.numero;
    // comentário e avaliação não devolvem o número do chamado
    if (!numero && rota.includes('/chamados/:id/')) {
      const c = await this.prisma.chamado.findUnique({ where: { id: req.params.id }, select: { numero: true } });
      numero = c?.numero;
    }
    await this.prisma.log.create({
      data: {
        organizacaoId: user.organizacaoId!,
        usuarioId: user.id,
        acao: res?.interno ? 'Nota interna adicionada' : acao,
        detalhe: detalhar(rota, res, req.body, numero),
      },
    });
  }

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    const rota = `${req.method} ${String(req.route?.path ?? '').replace(/^\/api/, '')}`;
    const acao = ACOES[rota];
    if (!acao) return next.handle();

    return next.handle().pipe(
      tap((res: any) => {
        // login e registro são rotas públicas: o usuário vem da resposta
        const user: Partial<UsuarioLogado> = req.user ?? res?.usuario ?? {};
        if (!user.organizacaoId) return;
        // falha no log não pode derrubar a ação do usuário
        this.gravar(rota, acao, user, res, req).catch((e) => this.logger.error(`Falha ao gravar log: ${e}`));
      }),
    );
  }
}

class FiltroLogDto {
  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  pagina: number = 1;

  @IsOptional() @IsInt() @Min(1) @Max(300) @Type(() => Number)
  porPagina: number = 50;

  @IsOptional() @IsString() @MaxLength(100)
  busca?: string;
}

@Controller('log')
class LogController {
  constructor(private readonly prisma: PrismaService) {}

  @Roles(Perfil.ADMIN)
  @Get()
  async listar(@CurrentUser() user: UsuarioLogado, @Query() { pagina, porPagina, busca }: FiltroLogDto) {
    const contem = { contains: busca, mode: 'insensitive' as const };
    const where: Prisma.LogWhereInput = {
      organizacaoId: user.organizacaoId,
      ...(busca && { OR: [{ acao: contem }, { detalhe: contem }, { usuario: { nome: contem } }] }),
    };
    const [itens, total] = await this.prisma.$transaction([
      this.prisma.log.findMany({
        where,
        // id desempata registros do mesmo instante, para não repetir entre páginas
        orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }],
        skip: (pagina - 1) * porPagina,
        take: porPagina,
        include: { usuario: { select: { nome: true } } },
      }),
      this.prisma.log.count({ where }),
    ]);
    return { itens, total };
  }
}

@Module({
  controllers: [LogController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: LogInterceptor }],
})
export class LogModule {}
