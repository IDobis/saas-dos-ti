-- AlterTable
ALTER TABLE "Organizacao" ADD COLUMN     "manutencaoDesde" TIMESTAMP(3),
ADD COLUMN     "manutencaoMotivo" TEXT,
ADD COLUMN     "manutencaoPrevisao" TIMESTAMP(3);
