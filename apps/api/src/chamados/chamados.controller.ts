import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Perfil } from '@prisma/client';
import { CurrentUser, Roles, UsuarioLogado } from '../common/auth';
import {
  AtribuirDto,
  AvaliarDto,
  CriarChamadoDto,
  DemoDto,
  FiltroChamadosDto,
  FollowUpDto,
  MudarStatusDto,
  ReabrirDto,
} from './chamados.dto';
import { ChamadosService } from './chamados.service';

@Controller('chamados')
export class ChamadosController {
  constructor(private readonly service: ChamadosService) {}

  @Get()
  listar(@CurrentUser() user: UsuarioLogado, @Query() filtro: FiltroChamadosDto) {
    return this.service.listar(user, filtro);
  }

  @Post()
  criar(@CurrentUser() user: UsuarioLogado, @Body() dto: CriarChamadoDto) {
    return this.service.criar(user, dto);
  }

  @Roles(Perfil.ADMIN)
  @Post('demo')
  seedDemo(@CurrentUser() user: UsuarioLogado, @Body() dto: DemoDto) {
    return this.service.seedDemo(user, dto);
  }

  @Roles(Perfil.ADMIN)
  @Delete('demo')
  removerDemo(@CurrentUser() user: UsuarioLogado) {
    return this.service.removerDemo(user);
  }

  @Get(':id')
  buscar(@CurrentUser() user: UsuarioLogado, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.buscar(user, id);
  }

  @Roles(Perfil.TECNICO, Perfil.ADMIN)
  @Patch(':id/atribuir')
  atribuir(
    @CurrentUser() user: UsuarioLogado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtribuirDto,
  ) {
    return this.service.atribuir(user, id, dto);
  }

  @Patch(':id/status')
  mudarStatus(
    @CurrentUser() user: UsuarioLogado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MudarStatusDto,
  ) {
    return this.service.mudarStatus(user, id, dto);
  }

  @Roles(Perfil.TECNICO, Perfil.ADMIN)
  @Patch(':id/reabrir')
  reabrir(
    @CurrentUser() user: UsuarioLogado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReabrirDto,
  ) {
    return this.service.reabrir(user, id, dto);
  }

  @Post(':id/followups')
  followUp(
    @CurrentUser() user: UsuarioLogado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FollowUpDto,
  ) {
    return this.service.followUp(user, id, dto);
  }

  @Post(':id/avaliacao')
  avaliar(
    @CurrentUser() user: UsuarioLogado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AvaliarDto,
  ) {
    return this.service.avaliar(user, id, dto);
  }
}
