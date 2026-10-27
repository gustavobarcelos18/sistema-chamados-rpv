import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { Prioridade, SituacaoChamado } from '../../generated/prisma/client';

export class FiltrarChamadosDto {
  @IsOptional()
  @IsEnum(SituacaoChamado)
  situacao?: SituacaoChamado;

  @IsOptional()
  @IsEnum(Prioridade)
  prioridade?: Prioridade;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tipoProblemaId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tecnicoId?: number;
}
