import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CriarTipoProblemaDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @MaxLength(191)
  nome: string;
}
