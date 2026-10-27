import { Module } from '@nestjs/common';
import { TiposProblemaController } from './tipos-problema.controller';
import { TiposProblemaService } from './tipos-problema.service';

@Module({
  controllers: [TiposProblemaController],
  providers: [TiposProblemaService],
  exports: [TiposProblemaService],
})
export class TiposProblemaModule {}
