-- CreateTable
CREATE TABLE "Log" (
    "id" TEXT NOT NULL,
    "organizacaoId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "acao" TEXT NOT NULL,
    "detalhe" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Log_organizacaoId_criadoEm_idx" ON "Log"("organizacaoId", "criadoEm");

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "Organizacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: o que já aconteceu antes do log existir
INSERT INTO "Log" ("id", "organizacaoId", "usuarioId", "acao", "detalhe", "criadoEm")
SELECT gen_random_uuid()::text, o."id", NULL, 'Organização registrada', o."nome", o."criadoEm"
FROM "Organizacao" o;

INSERT INTO "Log" ("id", "organizacaoId", "usuarioId", "acao", "detalhe", "criadoEm")
SELECT gen_random_uuid()::text, u."organizacaoId", NULL, 'Usuário cadastrado', u."nome" || ' (' || u."email" || ')', u."criadoEm"
FROM "Usuario" u;

INSERT INTO "Log" ("id", "organizacaoId", "usuarioId", "acao", "detalhe", "criadoEm")
SELECT gen_random_uuid()::text, c."organizacaoId", h."autorId",
  CASE h."tipo"
    WHEN 'CRIACAO' THEN 'Chamado aberto'
    WHEN 'MUDANCA_STATUS' THEN 'Status alterado'
    WHEN 'ATRIBUICAO' THEN 'Técnico atribuído'
    WHEN 'FOLLOWUP' THEN 'Follow-up adicionado'
    WHEN 'REABERTURA' THEN 'Chamado reaberto'
    WHEN 'CANCELAMENTO' THEN 'Chamado cancelado'
  END,
  '#' || c."numero" || COALESCE(' · ' || h."conteudo", ''),
  h."criadoEm"
FROM "HistoricoChamado" h JOIN "Chamado" c ON c."id" = h."chamadoId";
