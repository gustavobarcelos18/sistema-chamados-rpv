import { IsEnum } from 'class-validator';
import { SituacaoChamado } from '../../generated/prisma/client';

export class MudarSituacaoDto {
  @IsEnum(SituacaoChamado)
  situacao: SituacaoChamado;
}
