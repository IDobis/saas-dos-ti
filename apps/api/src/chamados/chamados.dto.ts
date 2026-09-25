import { Categoria, Prioridade, StatusChamado } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  Matches,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CriarChamadoDto {
  @IsString() @MinLength(3) @MaxLength(160)
  titulo!: string;

  @IsString() @MinLength(3) @MaxLength(5000)
  descricao!: string;

  @IsEnum(Categoria)
  categoria!: Categoria;

  @IsEnum(Prioridade)
  prioridade!: Prioridade;

  @IsUUID()
  setorId!: string;

  @IsOptional() @IsUUID()
  equipamentoId?: string;
}

export class FiltroChamadosDto {
  @IsOptional() @IsEnum(StatusChamado)
  status?: StatusChamado;

  @IsOptional() @IsEnum(Prioridade)
  prioridade?: Prioridade;

  @IsOptional() @IsEnum(Categoria)
  categoria?: Categoria;

  @IsOptional() @IsUUID()
  tecnicoId?: string;

  @IsOptional() @IsUUID()
  setorId?: string;

  @IsOptional() @IsUUID()
  solicitanteId?: string;

  @IsOptional() @IsString() @MaxLength(100)
  busca?: string;

  /** Período de abertura (ISO). */
  @IsOptional() @IsString()
  de?: string;

  @IsOptional() @IsString()
  ate?: string;
}

export class AtribuirDto {
  @IsUUID()
  tecnicoId!: string;
}

export class MudarStatusDto {
  @IsEnum(StatusChamado)
  status!: StatusChamado;

  /** Obrigatória para cancelamento (RN10). */
  @IsOptional() @IsString() @MaxLength(1000)
  justificativa?: string;
}

export class FollowUpDto {
  @IsString() @MinLength(1) @MaxLength(5000)
  conteudo!: string;

  /** Visível apenas a técnicos e administradores (RN12). */
  @IsOptional() @IsBoolean() @Type(() => Boolean)
  interno?: boolean;
}

export class AvaliarDto {
  @IsInt() @Min(1) @Max(5) @Type(() => Number)
  nota!: number;

  @IsOptional() @IsString() @MaxLength(1000)
  comentario?: string;
}

export class DemoDto {
  @IsInt() @Min(0) @Max(300) @Type(() => Number)
  abertos!: number;

  @IsInt() @Min(0) @Max(300) @Type(() => Number)
  resolvidos!: number;

  @IsInt() @Min(0) @Max(300) @Type(() => Number)
  emAndamento!: number;

  @IsInt() @Min(0) @Max(300) @Type(() => Number)
  resto!: number;

  /** Mês inicial, no formato AAAA-MM. */
  @IsString() @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  de!: string;

  /** Mês final, no formato AAAA-MM. */
  @IsString() @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  ate!: string;
}

export class ReabrirDto {
  @IsString() @MinLength(3) @MaxLength(1000)
  justificativa!: string;
}
