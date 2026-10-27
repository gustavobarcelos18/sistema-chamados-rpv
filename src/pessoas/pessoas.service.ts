import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TipoPessoa } from '../generated/prisma/client';
import { CriarPessoaDto } from './dto/criar-pessoa.dto';

@Injectable()
export class PessoasService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CriarPessoaDto) {
    try {
      return await this.prisma.pessoa.create({ data: dto });
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('E-mail já cadastrado'); // regra 1
      throw e;
    }
  }

  listar() {
    return this.prisma.pessoa.findMany({ orderBy: { id: 'asc' } });
  }

  async buscar(id: number) {
    const pessoa = await this.prisma.pessoa.findUnique({ where: { id } });
    if (!pessoa) throw new NotFoundException(`Pessoa ${id} não encontrada`);
    return pessoa;
  }

  // Regra 3: usado por chamados e comentários para barrar pessoas inativas.
  async buscarAtiva(id: number, tipo?: TipoPessoa) {
    const pessoa = await this.buscar(id);
    if (!pessoa.ativo) throw new BadRequestException(`Pessoa ${id} está inativa`);
    if (tipo && pessoa.tipo !== tipo) {
      throw new BadRequestException(`Pessoa ${id} não é do tipo ${tipo}`);
    }
    return pessoa;
  }

  async alterarStatus(id: number, ativo: boolean) {
    await this.buscar(id);
    return this.prisma.pessoa.update({ where: { id }, data: { ativo } });
  }

  // Regra 4: quem já está envolvido em chamados não é removido, só desativado.
  async remover(id: number) {
    await this.buscar(id);

    const [chamados, comentarios] = await Promise.all([
      this.prisma.chamado.count({
        where: { OR: [{ solicitanteId: id }, { tecnicoId: id }] },
      }),
      this.prisma.comentario.count({ where: { autorId: id } }),
    ]);

    if (chamados + comentarios > 0) {
      throw new ConflictException(
        'Pessoa já envolvida em chamados. Desative em vez de remover.',
      );
    }
    return this.prisma.pessoa.delete({ where: { id } });
  }
}
