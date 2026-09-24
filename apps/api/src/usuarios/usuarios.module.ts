import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Perfil } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { CurrentUser, Roles, UsuarioLogado } from '../common/auth';
import { PrismaService } from '../prisma/prisma.service';

class CriarUsuarioDto {
  @IsString() @MinLength(2) @MaxLength(120)
  nome!: string;

  @IsEmail()
  email!: string;

  @IsString() @MinLength(8) @MaxLength(72)
  senha!: string;

  @IsEnum(Perfil)
  perfil!: Perfil;

  @IsOptional() @IsUUID()
  setorId?: string;

  @IsOptional() @IsString() @MaxLength(80)
  especialidade?: string;

  @IsOptional() @IsString() @MaxLength(30)
  telefone?: string;
}

class FiltroUsuariosDto {
  @IsOptional() @IsEnum(Perfil)
  perfil?: Perfil;
}

const PUBLICO = {
  id: true,
  nome: true,
  email: true,
  perfil: true,
  telefone: true,
  especialidade: true,
  ativo: true,
  setor: { select: { id: true, nome: true } },
} as const;

@Injectable()
class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  listar(user: UsuarioLogado, f: FiltroUsuariosDto) {
    return this.prisma.usuario.findMany({
      where: { organizacaoId: user.organizacaoId, ...(f.perfil && { perfil: f.perfil }) },
      select: PUBLICO,
      orderBy: { nome: 'asc' },
    });
  }

  async criar(user: UsuarioLogado, dto: CriarUsuarioDto) {
    const email = dto.email.trim().toLowerCase();
    // o login identifica o usuário só pelo e-mail, então ele é único no sistema
    if (await this.prisma.usuario.findFirst({ where: { email } })) {
      throw new ConflictException('E-mail já cadastrado');
    }
    if (dto.setorId) {
      const setor = await this.prisma.setor.findFirst({
        where: { id: dto.setorId, organizacaoId: user.organizacaoId },
      });
      if (!setor) throw new BadRequestException('Setor inválido');
    }
    return this.prisma.usuario.create({
      data: {
        organizacaoId: user.organizacaoId,
        nome: dto.nome.trim(),
        email,
        senhaHash: await bcrypt.hash(dto.senha, 12),
        perfil: dto.perfil,
        setorId: dto.setorId,
        especialidade: dto.especialidade?.trim(),
        telefone: dto.telefone?.trim(),
      },
      select: PUBLICO,
    });
  }

  /** Usuários são inativados, não excluídos (RN11/RF01). */
  async alternarAtivo(user: UsuarioLogado, id: string) {
    if (id === user.id) throw new BadRequestException('Você não pode inativar a si mesmo');
    const alvo = await this.prisma.usuario.findFirst({
      where: { id, organizacaoId: user.organizacaoId },
    });
    if (!alvo) throw new NotFoundException('Usuário não encontrado');
    return this.prisma.usuario.update({
      where: { id },
      data: { ativo: !alvo.ativo },
      select: PUBLICO,
    });
  }
}

@Controller('usuarios')
class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Roles(Perfil.TECNICO, Perfil.ADMIN)
  @Get()
  listar(@CurrentUser() user: UsuarioLogado, @Query() filtro: FiltroUsuariosDto) {
    return this.service.listar(user, filtro);
  }

  @Roles(Perfil.ADMIN)
  @Post()
  criar(@CurrentUser() user: UsuarioLogado, @Body() dto: CriarUsuarioDto) {
    return this.service.criar(user, dto);
  }

  @Roles(Perfil.ADMIN)
  @Patch(':id/ativo')
  alternar(@CurrentUser() user: UsuarioLogado, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.alternarAtivo(user, id);
  }
}

@Module({ controllers: [UsuariosController], providers: [UsuariosService] })
export class UsuariosModule {}
