import { Module } from '@nestjs/common';
import { PessoasModule } from '../pessoas/pessoas.module';
import { ChamadosController } from './chamados.controller';
import { ChamadosService } from './chamados.service';

@Module({
  imports: [PessoasModule],
  controllers: [ChamadosController],
  providers: [ChamadosService],
})
export class ChamadosModule {}
