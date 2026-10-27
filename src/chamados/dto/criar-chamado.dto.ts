import { IsEnum, IsInt, IsOptional, IsString, Length, MinLength } from 'class-validator';
import { Prioridade } from '../../generated/prisma/client';

export class CriarChamadoDto {
  @IsInt()
  solicitanteId: number;

  @IsInt()
  tipoProblemaId: number;

  @IsString()
  @Length(5, 100, { message: 'O título deve ter entre 5 e 100 caracteres' }) // regra 10
  titulo: string;

  @IsString()
  @MinLength(10, { message: 'A descrição deve ter no mínimo 10 caracteres' }) // regra 10
  descricao: string;

  @IsOptional()
  @IsEnum(Prioridade) // regra 11
  prioridade?: Prioridade;
}
