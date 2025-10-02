import { prisma } from '@/config/prisma';
import { EntityType } from '@prisma/client';
import {
  CreateEntityInput,
  UpdateEntityInput,
} from './report.validation';

/**
 * Service pour la gestion des entités
 */
export class EntityService {
  /**
   * Crée une nouvelle entité
   */
  static async create(data: CreateEntityInput) {
    return prisma.entity.create({
      data: {
        label: data.label,
        type: data.type as EntityType,
        notes: data.notes,
      },
    });
  }

  /**
   * Met à jour une entité
   */
  static async update(id: string, data: UpdateEntityInput) {
    return prisma.entity.update({
      where: { id },
      data: {
        ...(data.label && { label: data.label }),
        ...(data.type && { type: data.type as EntityType }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  }

  /**
   * Récupère une entité par ID
   */
  static async findById(id: string) {
    return prisma.entity.findUnique({
      where: { id },
      include: {
        modules: {
          select: {
            id: true,
            reportId: true,
            type: true,
            title: true,
          },
        },
        researchRecords: {
          select: {
            id: true,
            subtitle: true,
            researchType: {
              select: {
                code: true,
                label: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Liste toutes les entités avec filtres
   */
  static async list(options?: {
    type?: EntityType;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (options?.type) {
      where.type = options.type;
    }

    if (options?.search) {
      where.OR = [
        { label: { contains: options.search, mode: 'insensitive' } },
        { notes: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [entities, total] = await Promise.all([
      prisma.entity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
        include: {
          _count: {
            select: {
              modules: true,
              researchRecords: true,
            },
          },
        },
      }),
      prisma.entity.count({ where }),
    ]);

    return {
      entities,
      total,
      limit: options?.limit || 50,
      offset: options?.offset || 0,
    };
  }

  /**
   * Supprime une entité
   */
  static async delete(id: string) {
    return prisma.entity.delete({
      where: { id },
    });
  }

  /**
   * Recherche des entités par type et valeur (pour autocomplétion)
   */
  static async search(query: string, type?: EntityType, limit = 10) {
    const where: any = {
      label: { contains: query, mode: 'insensitive' },
    };

    if (type) {
      where.type = type;
    }

    return prisma.entity.findMany({
      where,
      take: limit,
      orderBy: [{ label: 'asc' }],
      select: {
        id: true,
        label: true,
        type: true,
      },
    });
  }
}
