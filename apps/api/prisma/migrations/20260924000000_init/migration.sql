-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('SOLICITANTE', 'TECNICO', 'ADMIN');

-- CreateEnum
CREATE TYPE "Categoria" AS ENUM ('HARDWARE', 'SOFTWARE', 'REDE', 'ACESSO', 'OUTROS');

-- CreateEnum
CREATE TYPE "Prioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "StatusChamado" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO', 'RESOLVIDO', 'FECHADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoHistorico" AS ENUM ('CRIACAO', 'MUDANCA_STATUS', 'ATRIBUICAO', 'FOLLOWUP', 'REABERTURA', 'CANCELAMENTO');

-- CreateTable
CREATE TABLE "Organizacao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setor" (
    "id" TEXT NOT NULL,
    "organizacaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Setor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "organizacaoId" TEXT NOT NULL,
    "setorId" TEXT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "senhaHash" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL DEFAULT 'SOLICITANTE',
    "especialidade" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipamento" (
    "id" TEXT NOT NULL,
    "organizacaoId" TEXT NOT NULL,
    "setorId" TEXT,
    "usuarioId" TEXT,
    "nome" TEXT NOT NULL,
    "patrimonio" TEXT,
    "tipo" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Equipamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sla" (
    "id" TEXT NOT NULL,
    "organizacaoId" TEXT NOT NULL,
    "prioridade" "Prioridade" NOT NULL,
    "minutosAtendimento" INTEGER NOT NULL,
    "minutosResolucao" INTEGER NOT NULL,

    CONSTRAINT "Sla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chamado" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "organizacaoId" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "tecnicoId" TEXT,
    "setorId" TEXT NOT NULL,
    "equipamentoId" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" "Categoria" NOT NULL,
    "prioridade" "Prioridade" NOT NULL,
    "status" "StatusChamado" NOT NULL DEFAULT 'ABERTO',
    "prazoResolucao" TIMESTAMP(3),
    "abertoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvidoEm" TIMESTAMP(3),
    "fechadoEm" TIMESTAMP(3),
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chamado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoChamado" (
    "id" TEXT NOT NULL,
    "chamadoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "tipo" "TipoHistorico" NOT NULL,
    "conteudo" TEXT,
    "interno" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoChamado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anexo" (
    "id" TEXT NOT NULL,
    "chamadoId" TEXT NOT NULL,
    "enviadoPor" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "caminho" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Anexo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" TEXT NOT NULL,
    "chamadoId" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Setor_organizacaoId_nome_key" ON "Setor"("organizacaoId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_organizacaoId_email_key" ON "Usuario"("organizacaoId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Sla_organizacaoId_prioridade_key" ON "Sla"("organizacaoId", "prioridade");

-- CreateIndex
CREATE INDEX "Chamado_organizacaoId_status_idx" ON "Chamado"("organizacaoId", "status");

-- CreateIndex
CREATE INDEX "Chamado_organizacaoId_tecnicoId_idx" ON "Chamado"("organizacaoId", "tecnicoId");

-- CreateIndex
CREATE INDEX "HistoricoChamado_chamadoId_criadoEm_idx" ON "HistoricoChamado"("chamadoId", "criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "Avaliacao_chamadoId_key" ON "Avaliacao"("chamadoId");

-- AddForeignKey
ALTER TABLE "Setor" ADD CONSTRAINT "Setor_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "Organizacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "Organizacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "Setor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipamento" ADD CONSTRAINT "Equipamento_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "Organizacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipamento" ADD CONSTRAINT "Equipamento_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "Setor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipamento" ADD CONSTRAINT "Equipamento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sla" ADD CONSTRAINT "Sla_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "Organizacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chamado" ADD CONSTRAINT "Chamado_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "Organizacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chamado" ADD CONSTRAINT "Chamado_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chamado" ADD CONSTRAINT "Chamado_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chamado" ADD CONSTRAINT "Chamado_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "Setor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chamado" ADD CONSTRAINT "Chamado_equipamentoId_fkey" FOREIGN KEY ("equipamentoId") REFERENCES "Equipamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoChamado" ADD CONSTRAINT "HistoricoChamado_chamadoId_fkey" FOREIGN KEY ("chamadoId") REFERENCES "Chamado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoChamado" ADD CONSTRAINT "HistoricoChamado_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anexo" ADD CONSTRAINT "Anexo_chamadoId_fkey" FOREIGN KEY ("chamadoId") REFERENCES "Chamado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anexo" ADD CONSTRAINT "Anexo_enviadoPor_fkey" FOREIGN KEY ("enviadoPor") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_chamadoId_fkey" FOREIGN KEY ("chamadoId") REFERENCES "Chamado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

