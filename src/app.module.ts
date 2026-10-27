import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { PessoasModule } from './pessoas/pessoas.module';
import { TiposProblemaModule } from './tipos-problema/tipos-problema.module';
import { ChamadosModule } from './chamados/chamados.module';

@Module({
  imports: [PrismaModule, PessoasModule, TiposProblemaModule, ChamadosModule],
})
export class AppModule {}
