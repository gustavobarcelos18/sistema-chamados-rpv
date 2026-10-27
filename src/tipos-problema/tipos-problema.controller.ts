import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { TiposProblemaService } from './tipos-problema.service';
import { CriarTipoProblemaDto } from './dto/criar-tipo-problema.dto';
import { AlterarStatusDto } from '../common/dto/alterar-status.dto';

@Controller('tipos-problema')
export class TiposProblemaController {
  constructor(private readonly tipos: TiposProblemaService) {}

  @Post()
  criar(@Body() dto: CriarTipoProblemaDto) {
    return this.tipos.criar(dto);
  }

  @Get()
  listar() {
    return this.tipos.listar();
  }

  @Patch(':id/status')
  alterarStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AlterarStatusDto,
  ) {
    return this.tipos.alterarStatus(id, dto.ativo);
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.tipos.remover(id);
  }
}
