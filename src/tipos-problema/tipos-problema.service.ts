import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CriarTipoProblemaDto } from './dto/criar-tipo-problema.dto';

@Injectable()
export class TiposProblemaService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CriarTipoProblemaDto) {
    try {
      return await this.prisma.tipoProblema.create({ data: dto });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException('Já existe um tipo com esse nome'); // regra 5
      }
      throw e;
    }
  }

  listar() {
    return this.prisma.tipoProblema.findMany({ orderBy: { id: 'asc' } });
  }

  async buscar(id: number) {
    const tipo = await this.prisma.tipoProblema.findUnique({ where: { id } });
    if (!tipo) throw new NotFoundException(`Tipo ${id} não encontrado`);
    return tipo;
  }

  async alterarStatus(id: number, ativo: boolean) {
    await this.buscar(id);
    return this.prisma.tipoProblema.update({ where: { id }, data: { ativo } });
  }

  // Regra 7: tipo já usado em chamado não é removido, só desativado.
  async remover(id: number) {
    await this.buscar(id);
    const usos = await this.prisma.chamado.count({ where: { tipoProblemaId: id } });
    if (usos > 0) {
      throw new ConflictException('Tipo já usado em chamados. Desative em vez de remover.');
    }
    return this.prisma.tipoProblema.delete({ where: { id } });
  }
}
