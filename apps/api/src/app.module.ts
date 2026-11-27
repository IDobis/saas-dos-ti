import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ChamadosModule } from './chamados/chamados.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { LogModule } from './log/log.module';
import { ManutencaoModule } from './manutencao/manutencao.module';
import { NotificacoesModule } from './notificacoes/notificacoes.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReincidenciaModule } from './reincidencia/reincidencia.module';
import { RelatorioModule } from './relatorio/relatorio.module';
import { SetoresModule } from './setores/setores.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }]),
    PrismaModule,
    AuthModule,
    ChamadosModule,
    SetoresModule,
    UsuariosModule,
    DashboardModule,
    ManutencaoModule,
    ReincidenciaModule,
    NotificacoesModule,
    RelatorioModule,
    LogModule,
  ],
})
export class AppModule {}
