import { Module } from '@nestjs/common';
import { ChamadosController } from './chamados.controller';
import { ChamadosService } from './chamados.service';

@Module({ controllers: [ChamadosController], providers: [ChamadosService] })
export class ChamadosModule {}
