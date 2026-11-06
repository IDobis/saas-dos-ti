import {
  Body,
  CanActivate,
  Controller,
  Delete,
  ExecutionContext,
  Get,
  Injectable,
  Module,
  Post,
  ServiceUnavailableException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Perfil } from '@prisma/client';
import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CurrentUser, IS_PUBLIC, Roles, UsuarioLogado } from '../common/auth';
import { PrismaService } from '../prisma/prisma.service';

/** Rotas que continuam aceitando escrita durante a manutenção. */
const LIBERADO = 'liberadoEmManutencao';
const LiberadoEmManutencao = () => SetMetadata(LIBERADO, true);

class EntrarManutencaoDto {
  @IsString() @MinLength(3) @MaxLength(300)
  motivo!: string;

  @IsOptional() @IsDateString()
  previsao?: string;
}

const SELECAO = { manutencaoDesde: true, manutencaoMotivo: true, manutencaoPrevisao: true } as const;

function situacao(o: { manutencaoDesde: Date | null; manutencaoMotivo: string | null; manutencaoPrevisao: Date | null }) {
  return {
    ativa: !!o.manutencaoDesde,
    desde: o.manutencaoDesde,
    motivo: o.manutencaoMotivo,
    previsao: o.manutencaoPrevisao,
  };
}

/**
 * Com a organização em manutenção, só leitura: bloqueia POST/PATCH/PUT/DELETE.
 * Rotas públicas (login, registro) e as de sair/entrar do modo seguem liberadas.
 * Registrado depois do JwtAuthGuard, então req.user já está preenchido.
 */
@Injectable()
export class ManutencaoGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;
    const liberado = this.reflector.getAllAndOverride<boolean>(LIBERADO, [ctx.getHandler(), ctx.getClass()]);
    const publica = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()]);
    const user: UsuarioLogado | undefined = req.user;
    if (liberado || publica || !user) return true;

    const org = await this.prisma.organizacao.findUnique({
      where: { id: user.organizacaoId },
      select: SELECAO,
    });
    if (org?.manutencaoDesde) {
      throw new ServiceUnavailableException(
        `Sistema em manutenção: ${org.manutencaoMotivo}. Apenas consultas estão liberadas.`,
      );
    }
    return true;
  }
}

@Injectable()
class ManutencaoService {
  constructor(private readonly prisma: PrismaService) {}

  async consultar(user: UsuarioLogado) {
    const org = await this.prisma.organizacao.findUniqueOrThrow({
      where: { id: user.organizacaoId },
      select: SELECAO,
    });
    return situacao(org);
  }

  async entrar(user: UsuarioLogado, dto: EntrarManutencaoDto) {
    const org = await this.prisma.organizacao.update({
      where: { id: user.organizacaoId },
      data: {
        manutencaoDesde: new Date(),
        manutencaoMotivo: dto.motivo.trim(),
        manutencaoPrevisao: dto.previsao ? new Date(dto.previsao) : null,
      },
      select: SELECAO,
    });
    return situacao(org);
  }

  async sair(user: UsuarioLogado) {
    const org = await this.prisma.organizacao.update({
      where: { id: user.organizacaoId },
      data: { manutencaoDesde: null, manutencaoMotivo: null, manutencaoPrevisao: null },
      select: SELECAO,
    });
    return situacao(org);
  }
}

@Controller('manutencao')
class ManutencaoController {
  constructor(private readonly service: ManutencaoService) {}

  @Get()
  consultar(@CurrentUser() user: UsuarioLogado) {
    return this.service.consultar(user);
  }

  @Roles(Perfil.ADMIN)
  @LiberadoEmManutencao()
  @Post()
  entrar(@CurrentUser() user: UsuarioLogado, @Body() dto: EntrarManutencaoDto) {
    return this.service.entrar(user, dto);
  }

  @Roles(Perfil.ADMIN)
  @LiberadoEmManutencao()
  @Delete()
  sair(@CurrentUser() user: UsuarioLogado) {
    return this.service.sair(user);
  }
}

@Module({ controllers: [ManutencaoController], providers: [ManutencaoService] })
export class ManutencaoModule {}
