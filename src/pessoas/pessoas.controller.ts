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
import { PessoasService } from './pessoas.service';
import { CriarPessoaDto } from './dto/criar-pessoa.dto';
import { AlterarStatusDto } from '../common/dto/alterar-status.dto';

@Controller('pessoas')
export class PessoasController {
  constructor(private readonly pessoas: PessoasService) {}

  @Post()
  criar(@Body() dto: CriarPessoaDto) {
    return this.pessoas.criar(dto);
  }

  @Get()
  listar() {
    return this.pessoas.listar();
  }

  @Patch(':id/status')
  alterarStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AlterarStatusDto,
  ) {
    return this.pessoas.alterarStatus(id, dto.ativo);
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.pessoas.remover(id);
  }
}
