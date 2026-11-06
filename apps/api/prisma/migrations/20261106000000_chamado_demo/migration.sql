-- AlterTable
ALTER TABLE "Chamado" ADD COLUMN "demo" BOOLEAN NOT NULL DEFAULT false;

-- Marca os chamados de demonstração que já existem
UPDATE "Chamado" SET "demo" = true WHERE "titulo" LIKE '[Demo] %';
