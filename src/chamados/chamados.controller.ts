import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ChamadosService } from './chamados.service';
import { CriarChamadoDto } from './dto/criar-chamado.dto';
import { FiltrarChamadosDto } from './dto/filtrar-chamados.dto';
import { DesignarTecnicoDto } from './dto/designar-tecnico.dto';
import { MudarSituacaoDto } from './dto/mudar-situacao.dto';
import { CriarComentarioDto } from './dto/criar-comentario.dto';

@Controller('chamados')
export class ChamadosController {
  constructor(private readonly chamados: ChamadosService) {}

  @Post()
  criar(@Body() dto: CriarChamadoDto) {
    return this.chamados.criar(dto);
  }

  @Get()
  listar(@Query() filtros: FiltrarChamadosDto) {
    return this.chamados.listar(filtros);
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.chamados.buscar(id);
  }

  @Patch(':id/designar')
  designar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DesignarTecnicoDto,
  ) {
    return this.chamados.designar(id, dto.tecnicoId);
  }

  @Patch(':id/situacao')
  mudarSituacao(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MudarSituacaoDto,
  ) {
    return this.chamados.mudarSituacao(id, dto.situacao);
  }

  @Post(':id/comentarios')
  comentar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CriarComentarioDto,
  ) {
    return this.chamados.comentar(id, dto);
  }
}
