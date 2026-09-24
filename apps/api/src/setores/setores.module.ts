import {
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
} from '@nestjs/common';
import { Perfil } from '@prisma/client';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { CurrentUser, Roles, UsuarioLogado } from '../common/auth';
import { PrismaService } from '../prisma/prisma.service';

class SetorDto {
  @IsString() @MinLength(2) @MaxLength(80)
  nome!: string;
}

@Injectable()
class SetoresService {
  constructor(private readonly prisma: PrismaService) {}

  listar(user: UsuarioLogado) {
    return this.prisma.setor.findMany({
      where: { organizacaoId: user.organizacaoId },
      orderBy: { nome: 'asc' },
    });
  }

  async criar(user: UsuarioLogado, dto: SetorDto) {
    const nome = dto.nome.trim();
    const existe = await this.prisma.setor.findUnique({
      where: { organizacaoId_nome: { organizacaoId: user.organizacaoId, nome } },
    });
    if (existe) throw new ConflictException('Setor já existe');
    return this.prisma.setor.create({ data: { organizacaoId: user.organizacaoId, nome } });
  }

  /** RN11: setor não é excluído, apenas inativado/reativado. */
  async alternarAtivo(user: UsuarioLogado, id: string) {
    const setor = await this.prisma.setor.findFirst({
      where: { id, organizacaoId: user.organizacaoId },
    });
    if (!setor) throw new NotFoundException('Setor não encontrado');
    return this.prisma.setor.update({ where: { id }, data: { ativo: !setor.ativo } });
  }
}

@Controller('setores')
class SetoresController {
  constructor(private readonly service: SetoresService) {}

  @Get()
  listar(@CurrentUser() user: UsuarioLogado) {
    return this.service.listar(user);
  }

  @Roles(Perfil.ADMIN)
  @Post()
  criar(@CurrentUser() user: UsuarioLogado, @Body() dto: SetorDto) {
    return this.service.criar(user, dto);
  }

  @Roles(Perfil.ADMIN)
  @Patch(':id/ativo')
  alternar(@CurrentUser() user: UsuarioLogado, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.alternarAtivo(user, id);
  }
}

@Module({ controllers: [SetoresController], providers: [SetoresService] })
export class SetoresModule {}
