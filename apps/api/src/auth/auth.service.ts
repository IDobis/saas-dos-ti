import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Perfil, Prioridade } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { JwtPayload } from '../common/auth';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegistrarDto } from './auth.dto';

/** SLA padrão (RN02), em minutos. O admin poderá ajustar depois. */
const SLA_PADRAO: Record<Prioridade, { atendimento: number; resolucao: number }> = {
  CRITICA: { atendimento: 30, resolucao: 4 * 60 },
  ALTA: { atendimento: 2 * 60, resolucao: 8 * 60 },
  MEDIA: { atendimento: 4 * 60, resolucao: 24 * 60 },
  BAIXA: { atendimento: 8 * 60, resolucao: 72 * 60 },
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async registrar(dto: RegistrarDto) {
    const email = dto.email.trim().toLowerCase();
    const jaExiste = await this.prisma.usuario.findFirst({ where: { email } });
    if (jaExiste) throw new ConflictException('E-mail já cadastrado');

    const senhaHash = await bcrypt.hash(dto.senha, 12);
    const usuario = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organizacao.create({ data: { nome: dto.organizacao.trim() } });
      await tx.sla.createMany({
        data: (Object.keys(SLA_PADRAO) as Prioridade[]).map((p) => ({
          organizacaoId: org.id,
          prioridade: p,
          minutosAtendimento: SLA_PADRAO[p].atendimento,
          minutosResolucao: SLA_PADRAO[p].resolucao,
        })),
      });
      await tx.setor.create({ data: { organizacaoId: org.id, nome: 'TI' } });
      return tx.usuario.create({
        data: {
          organizacaoId: org.id,
          nome: dto.nome.trim(),
          email,
          senhaHash,
          perfil: Perfil.ADMIN,
        },
      });
    });
    return this.emitirToken(usuario);
  }

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { email: dto.email.trim().toLowerCase(), ativo: true },
    });
    // mesma mensagem para e-mail inexistente e senha errada
    const ok = usuario && (await bcrypt.compare(dto.senha, usuario.senhaHash));
    if (!usuario || !ok) throw new UnauthorizedException('E-mail ou senha inválidos');
    return this.emitirToken(usuario);
  }

  async me(id: string) {
    const u = await this.prisma.usuario.findUniqueOrThrow({
      where: { id },
      include: { organizacao: { select: { nome: true } } },
    });
    return this.perfilPublico(u);
  }

  private async emitirToken(u: {
    id: string;
    organizacaoId: string;
    perfil: Perfil;
    nome: string;
    email: string;
    setorId: string | null;
  }) {
    const payload: JwtPayload = { sub: u.id, org: u.organizacaoId, perfil: u.perfil };
    return { token: await this.jwt.signAsync(payload), usuario: this.perfilPublico(u) };
  }

  private perfilPublico(u: {
    id: string;
    nome: string;
    email: string;
    perfil: Perfil;
    organizacaoId: string;
    organizacao?: { nome: string };
  }) {
    return {
      id: u.id,
      nome: u.nome,
      email: u.email,
      perfil: u.perfil,
      organizacaoId: u.organizacaoId,
      organizacao: u.organizacao?.nome,
    };
  }
}
