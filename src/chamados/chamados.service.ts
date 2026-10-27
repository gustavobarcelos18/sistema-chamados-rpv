import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PessoasService } from '../pessoas/pessoas.service';
import { Prisma, SituacaoChamado, TipoPessoa } from '../generated/prisma/client';
import { CriarChamadoDto } from './dto/criar-chamado.dto';
import { FiltrarChamadosDto } from './dto/filtrar-chamados.dto';
import { CriarComentarioDto } from './dto/criar-comentario.dto';

// Regra 14: transições permitidas.
// ABERTO → EM_ATENDIMENTO não está aqui de propósito: acontece só via designação (regra 13).
const TRANSICOES: Record<SituacaoChamado, SituacaoChamado[]> = {
  ABERTO: ['CANCELADO'],
  EM_ATENDIMENTO: ['RESOLVIDO', 'CANCELADO'],
  RESOLVIDO: ['FECHADO', 'EM_ATENDIMENTO'],
  FECHADO: [],
  CANCELADO: [],
};

const LIMITE_EM_ATENDIMENTO = 5; // regra 17

const SERIALIZABLE = { isolationLevel: Prisma.TransactionIsolationLevel.Serializable };

@Injectable()
export class ChamadosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pessoas: PessoasService,
  ) {}

  async criar(dto: CriarChamadoDto) {
    await this.pessoas.buscarAtiva(dto.solicitanteId, TipoPessoa.SOLICITANTE); // regra 9

    const tipo = await this.prisma.tipoProblema.findUnique({ where: { id: dto.tipoProblemaId } });
    if (!tipo) throw new NotFoundException('Tipo de problema não encontrado');
    if (!tipo.ativo) throw new BadRequestException('Tipo de problema desativado'); // regra 6

    return this.prisma.chamado.create({
      data: {
        titulo: dto.titulo,
        descricao: dto.descricao,
        prioridade: dto.prioridade ?? 'MEDIA', // regra 11
        solicitanteId: dto.solicitanteId,
        tipoProblemaId: dto.tipoProblemaId,
        // situacao = ABERTO e tecnicoId = null vêm do default do schema (regra 8)
      },
    });
  }

  listar(filtros: FiltrarChamadosDto) {
    return this.prisma.chamado.findMany({
      where: {
        situacao: filtros.situacao,
        prioridade: filtros.prioridade,
        tipoProblemaId: filtros.tipoProblemaId,
        tecnicoId: filtros.tecnicoId,
      },
      orderBy: { id: 'asc' },
    });
  }

  // Chamado com a conversa completa.
  async buscar(id: number) {
    const chamado = await this.prisma.chamado.findUnique({
      where: { id },
      include: {
        solicitante: true,
        tecnico: true,
        tipoProblema: true,
        comentarios: { include: { autor: true }, orderBy: { criadoEm: 'asc' } },
      },
    });
    if (!chamado) throw new NotFoundException(`Chamado ${id} não encontrado`);
    return chamado;
  }

  // Regras 12, 13, 17 e 18.
  async designar(id: number, tecnicoId: number) {
    const chamado = await this.buscar(id);

    if (chamado.situacao !== 'ABERTO' || chamado.tecnicoId !== null) {
      throw new ConflictException(
        'Só é possível designar técnico em chamado aberto e sem responsável', // regra 12
      );
    }
    if (tecnicoId === chamado.solicitanteId) {
      throw new BadRequestException('Ninguém pode atender o próprio chamado'); // regra 18
    }

    await this.pessoas.buscarAtiva(tecnicoId, TipoPessoa.TECNICO); // regra 3

    return this.prisma.$transaction(async (tx) => {
      await this.validarCargaTecnico(tx, tecnicoId); // regra 17

      // O filtro no updateMany garante que só um técnico seja designado (regra 12),
      // mesmo com requisições simultâneas.
      const { count } = await tx.chamado.updateMany({
        where: { id, situacao: 'ABERTO', tecnicoId: null },
        data: { tecnicoId, situacao: 'EM_ATENDIMENTO' }, // regra 13
      });
      if (count === 0) throw new ConflictException('Chamado já foi designado');

      return tx.chamado.findUnique({ where: { id } });
    }, SERIALIZABLE);
  }

  // Regras 14, 15 e 16.
  async mudarSituacao(id: number, nova: SituacaoChamado) {
    return this.prisma.$transaction(async (tx) => {
      const chamado = await tx.chamado.findUnique({ where: { id } });
      if (!chamado) throw new NotFoundException(`Chamado ${id} não encontrado`);

      if (chamado.situacao === 'FECHADO' || chamado.situacao === 'CANCELADO') {
        throw new ConflictException('Chamado encerrado não pode ser alterado'); // regra 15
      }
      if (!TRANSICOES[chamado.situacao].includes(nova)) {
        throw new BadRequestException(`Transição proibida: ${chamado.situacao} → ${nova}`); // regra 14
      }
      if (nova === 'EM_ATENDIMENTO') {
        // Reabertura (RESOLVIDO → EM_ATENDIMENTO) também conta no limite da regra 17
        await this.validarCargaTecnico(tx, chamado.tecnicoId!);
      }

      return tx.chamado.update({
        where: { id },
        data: {
          situacao: nova,
          // Regra 16: registra o momento da resolução
          ...(nova === 'RESOLVIDO' && { resolvidoEm: new Date() }),
        },
      });
    }, SERIALIZABLE);
  }

  // Regras 15, 19 e 20. Não existe rota de edição ou exclusão de comentários (regra 21).
  async comentar(chamadoId: number, dto: CriarComentarioDto) {
    const chamado = await this.buscar(chamadoId);

    if (chamado.situacao === 'FECHADO' || chamado.situacao === 'CANCELADO') {
      throw new ConflictException('Chamado encerrado não recebe comentários'); // regra 15
    }

    await this.pessoas.buscarAtiva(dto.autorId); // regra 3

    const podeComentar =
      dto.autorId === chamado.solicitanteId || dto.autorId === chamado.tecnicoId;
    if (!podeComentar) {
      throw new ForbiddenException(
        'Só quem abriu o chamado ou o técnico responsável pode comentar', // regra 19
      );
    }

    return this.prisma.comentario.create({
      data: { chamadoId, autorId: dto.autorId, texto: dto.texto },
    });
  }

  private async validarCargaTecnico(tx: Prisma.TransactionClient, tecnicoId: number) {
    const emAtendimento = await tx.chamado.count({
      where: { tecnicoId, situacao: 'EM_ATENDIMENTO' },
    });
    if (emAtendimento >= LIMITE_EM_ATENDIMENTO) {
      throw new ConflictException(
        `Técnico já tem ${LIMITE_EM_ATENDIMENTO} chamados em atendimento`,
      );
    }
  }
}
