import { IsEmail, IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { TipoPessoa } from '../../generated/prisma/client';

export class CriarPessoaDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @MaxLength(191)
  nome: string;

  @IsEmail({}, { message: 'E-mail inválido' }) // regra 1
  email: string;

  @IsEnum(TipoPessoa, { message: 'Tipo deve ser SOLICITANTE ou TECNICO' }) // regra 2
  tipo: TipoPessoa;
}
