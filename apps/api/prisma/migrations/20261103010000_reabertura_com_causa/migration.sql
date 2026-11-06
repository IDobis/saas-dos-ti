-- CreateEnum
CREATE TYPE "CausaReabertura" AS ENUM ('VOLTOU_A_FALHAR', 'SOLUCAO_INCOMPLETA', 'USUARIO_NAO_VALIDOU');

-- AlterTable
ALTER TABLE "HistoricoChamado" ADD COLUMN     "causaReabertura" "CausaReabertura",
ADD COLUMN     "tecnicoResponsavelId" TEXT;
