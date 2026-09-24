import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Perfil } from '@prisma/client';

export interface UsuarioLogado {
  id: string;
  organizacaoId: string;
  perfil: Perfil;
}

export interface JwtPayload {
  sub: string;
  org: string;
  perfil: Perfil;
}

export const IS_PUBLIC = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);

export const ROLES = 'roles';
export const Roles = (...perfis: Perfil[]) => SetMetadata(ROLES, perfis);

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UsuarioLogado =>
    ctx.switchToHttp().getRequest().user,
);

/** Exige token JWT válido em todas as rotas, exceto as marcadas com @Public(). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const publica = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (publica) return true;

    const req = ctx.switchToHttp().getRequest();
    const [tipo, token] = (req.headers.authorization ?? '').split(' ');
    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token ausente');
    }
    try {
      const p = await this.jwt.verifyAsync<JwtPayload>(token);
      req.user = { id: p.sub, organizacaoId: p.org, perfil: p.perfil } satisfies UsuarioLogado;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}

/** Restringe a rota aos perfis informados em @Roles(). */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const perfis = this.reflector.getAllAndOverride<Perfil[]>(ROLES, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!perfis?.length) return true;
    const user: UsuarioLogado | undefined = ctx.switchToHttp().getRequest().user;
    if (!user || !perfis.includes(user.perfil)) {
      throw new ForbiddenException('Sem permissão para esta ação');
    }
    return true;
  }
}
