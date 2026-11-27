import {
  CallHandler,
  Controller,
  ExecutionContext,
  Get,
  Injectable,
  Logger,
  Module,
  NestInterceptor,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Perfil } from '@prisma/client';
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
  'POST /chamados/:id/followups': 'Follow-up adicionado',
  'POST /chamados/:id/avaliacao': 'Chamado avaliado',
  'POST /setores': 'Setor criado',
  'PATCH /setores/:id/ativo': 'Setor ativado/inativado',
  'POST /usuarios': 'Usuário cadastrado',
  'PATCH /usuarios/:id/ativo': 'Usuário ativado/inativado',
  'POST /manutencao': 'Modo manutenção ativado',
  'DELETE /manutencao': 'Modo manutenção desativado',
};

/** Descreve o alvo da ação a partir da resposta (nº do chamado, nome) e do corpo. */
function detalhar(res: any, body: any): string | null {
  const alvo = res?.numero ? `#${res.numero}` : (res?.nome ?? res?.usuario?.email);
  const extra = body?.status ?? (typeof res?.ativo === 'boolean' ? (res.ativo ? 'ativo' : 'inativo') : undefined);
  return [alvo, extra].filter(Boolean).join(' · ') || null;
}

/** Grava no Log cada ação da tabela ACOES que terminou com sucesso. */
@Injectable()
class LogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Log');

  constructor(private readonly prisma: PrismaService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    const acao = ACOES[`${req.method} ${String(req.route?.path ?? '').replace(/^\/api/, '')}`];
    if (!acao) return next.handle();

    return next.handle().pipe(
      tap((res: any) => {
        // login e registro são rotas públicas: o usuário vem da resposta
        const user: Partial<UsuarioLogado> = req.user ?? res?.usuario ?? {};
        if (!user.organizacaoId) return;
        this.prisma.log
          .create({
            data: {
              organizacaoId: user.organizacaoId,
              usuarioId: user.id,
              acao,
              detalhe: detalhar(res, req.body),
            },
          })
          // falha no log não pode derrubar a ação do usuário
          .catch((e) => this.logger.error(`Falha ao gravar log: ${e}`));
      }),
    );
  }
}

@Controller('log')
class LogController {
  constructor(private readonly prisma: PrismaService) {}

  @Roles(Perfil.ADMIN)
  @Get()
  listar(@CurrentUser() user: UsuarioLogado) {
    return this.prisma.log.findMany({
      where: { organizacaoId: user.organizacaoId },
      orderBy: { criadoEm: 'desc' },
      take: 1000, // shortcut: sem paginação; paginar se passar disso
      include: { usuario: { select: { nome: true } } },
    });
  }
}

@Module({
  controllers: [LogController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: LogInterceptor }],
})
export class LogModule {}
