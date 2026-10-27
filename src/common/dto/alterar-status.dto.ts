import { IsBoolean } from 'class-validator';

export class AlterarStatusDto {
  @IsBoolean()
  ativo: boolean;
}
