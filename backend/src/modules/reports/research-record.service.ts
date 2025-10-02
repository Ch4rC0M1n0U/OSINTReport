import { prisma } from '@/config/prisma';
import {
  CreateResearchRecordInput,
  UpdateResearchRecordInput,
} from './report.validation';

/**
 * Service pour la gestion des enregistrements de recherche
 */
export class ResearchRecordService {
  /**
   * Crée un enregistrement de recherche dans un module
   */
  static async create(moduleId: string, data: CreateResearchRecordInput) {
    return prisma.researchRecord.create({
      data: {
        reportModuleId: moduleId,
        researchTypeId: data.researchTypeId,
        entityId: data.entityId,
        subtitle: data.subtitle,
        details: data.details || {},
        sensitiveDataRef: data.sensitiveDataRef,
      },
      include: {
        researchType: true,
        entity: true,
      },
    });
  }

  /**
   * Met à jour un enregistrement de recherche
   */
  static async update(id: string, data: UpdateResearchRecordInput) {
    return prisma.researchRecord.update({
      where: { id },
      data: {
        ...(data.researchTypeId && { researchTypeId: data.researchTypeId }),
        ...(data.entityId !== undefined && { entityId: data.entityId }),
        ...(data.subtitle !== undefined && { subtitle: data.subtitle }),
        ...(data.details !== undefined && { details: data.details }),
        ...(data.sensitiveDataRef !== undefined && {
          sensitiveDataRef: data.sensitiveDataRef,
        }),
      },
      include: {
        researchType: true,
        entity: true,
      },
    });
  }

  /**
   * Récupère un enregistrement par ID
   */
  static async findById(id: string) {
    return prisma.researchRecord.findUnique({
      where: { id },
      include: {
        researchType: true,
        entity: true,
        module: {
          select: {
            id: true,
            reportId: true,
            type: true,
            title: true,
          },
        },
        vaultItem: {
          select: {
            id: true,
            field: true,
          },
        },
      },
    });
  }

  /**
   * Liste les enregistrements d'un module
   */
  static async listByModule(moduleId: string) {
    return prisma.researchRecord.findMany({
      where: { reportModuleId: moduleId },
      orderBy: { createdAt: 'desc' },
      include: {
        researchType: true,
        entity: {
          select: {
            id: true,
            label: true,
            type: true,
          },
        },
      },
    });
  }

  /**
   * Supprime un enregistrement de recherche
   */
  static async delete(id: string) {
    return prisma.researchRecord.delete({
      where: { id },
    });
  }

  /**
   * Liste tous les types de recherche disponibles
   */
  static async listResearchTypes() {
    return prisma.researchType.findMany({
      where: { active: true },
      orderBy: { label: 'asc' },
      select: {
        id: true,
        code: true,
        label: true,
      },
    });
  }

  /**
   * Crée un nouveau type de recherche
   */
  static async createResearchType(data: {
    code: string;
    label: string;
    active?: boolean;
  }) {
    return prisma.researchType.create({
      data: {
        code: data.code,
        label: data.label,
        active: data.active ?? true,
      },
    });
  }
}
