import { CallHandler, ExecutionContext, Injectable, Module, NestInterceptor } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Observable, tap } from 'rxjs';
import type { Server } from 'socket.io';
import { JwtPayload } from '../common/auth';
import { PrismaService } from '../prisma/prisma.service';

// shortcut: salas em memória, vale para uma instância da API; com várias, usar o adapter Redis do socket.io
@WebSocketGateway({
  cors: {
    // função porque o .env ainda não foi carregado quando o decorator é avaliado
    origin: (origem: string | undefined, ok: (erro: Error | null, liberado: boolean) => void) =>
      ok(null, !origem || (process.env.WEB_ORIGIN ?? 'http://localhost:3100').split(',').includes(origem)),
  },
})
export class TempoRealGateway implements OnGatewayInit {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /** Os guards HTTP não valem aqui: só conecta com token válido de usuário ativo, na sala da organização. */
  afterInit(server: Server) {
    server.use(async (socket, next) => {
      try {
        const p = await this.jwt.verifyAsync<JwtPayload>(socket.handshake.auth.token);
        const u = await this.prisma.usuario.findUnique({
          where: { id: p.sub },
          select: { organizacaoId: true, ativo: true },
        });
        if (!u?.ativo) return next(new Error('Não autorizado'));
        await socket.join(u.organizacaoId);
        next();
      } catch {
        next(new Error('Não autorizado'));
      }
    });
  }
}

/** Depois de cada alteração em chamados, avisa a organização para buscar de novo. */
@Injectable()
class AvisoChamadosInterceptor implements NestInterceptor {
  constructor(private readonly gateway: TempoRealGateway) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    if (req.method === 'GET' || !String(req.route?.path).startsWith('/api/chamados')) return next.handle();
    // sem dados no evento: cada cliente refaz a consulta e a API aplica as permissões (RN09, RN12)
    return next.handle().pipe(tap(() => this.gateway.server.to(req.user.organizacaoId).emit('chamados')));
  }
}

@Module({
  providers: [TempoRealGateway, { provide: APP_INTERCEPTOR, useClass: AvisoChamadosInterceptor }],
})
export class TempoRealModule {}
