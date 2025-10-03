import createError from "http-errors";
import type { Prisma } from "@prisma/client";

import { prisma } from "@shared/prisma";
import {
  CreateModuleInput,
  CreateReportInput,
  ListReportsQuery,
  RegisterAttachmentInput,
  UpdateModuleInput,
  UpdateReportInput,
} from "@modules/reports/report.validation";
import { VaultService } from "@modules/security/vault.service";
import { SearchService } from "@modules/search/search.service";
import { logger } from "@config/logger";

export class ReportService {
  private static async resolveAttachmentSecret<T extends { storageKey: string }>(
    attachment: T,
    client?: Prisma.TransactionClient
  ): Promise<T> {
    if (!VaultService.isPointer(attachment.storageKey)) {
      return attachment;
    }

    const storageKey = await VaultService.revealString(attachment.storageKey, client);
    return {
      ...attachment,
      storageKey,
    };
  }

  private static async resolveAttachments<
    T extends { attachments: Array<{ storageKey: string }> }
  >(entity: T, client?: Prisma.TransactionClient): Promise<T> {
    if (!entity.attachments?.length) {
      return entity;
    }

    const decrypted = await Promise.all(
      entity.attachments.map((attachment) => this.resolveAttachmentSecret(attachment, client))
    );

    return {
      ...entity,
      attachments: decrypted,
    };
  }

  static async listReports(query: ListReportsQuery) {
    const { limit, offset, orderBy, order, status, search } = query;

    const where = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { caseNumber: { contains: search, mode: "insensitive" } },
              { reportNumber: { contains: search, mode: "insensitive" } },
              { requestingService: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const orderByField = orderBy ?? "issuedAt";

    const [items, total] = await prisma.$transaction([
      prisma.report.findMany({
        where,
        orderBy: {
          [orderByField]: order,
        },
        skip: offset,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return {
      items,
      total,
      limit,
      offset,
    };
  }

  static async getDashboardSummary() {
    const windowDays = 30;
    const now = new Date();
    const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    startDate.setUTCDate(startDate.getUTCDate() - (windowDays - 1));

    type StatusKey = "DRAFT" | "PUBLISHED" | "ARCHIVED";

    const statusGroups = await prisma.report.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    const recentReports = (await prisma.report.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        issuedAt: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })) as Array<{
      id: string;
      title: string;
      status: StatusKey;
      issuedAt: Date | null;
      updatedAt: Date;
      owner: { id: string; firstName: string; lastName: string };
    }>;

    const timelineRows = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT date_trunc('day', "createdAt")::date AS date,
             COUNT(*)::bigint AS count
      FROM "Report"
      WHERE "createdAt" >= ${startDate}
      GROUP BY 1
      ORDER BY 1
    `;

    const totals = {
      all: 0,
      draft: 0,
      published: 0,
      archived: 0,
    };

    for (const group of statusGroups) {
      const count = Number(group._count._all ?? 0);
      totals.all += count;

      switch (group.status) {
        case "DRAFT":
          totals.draft = count;
          break;
        case "PUBLISHED":
          totals.published = count;
          break;
        case "ARCHIVED":
          totals.archived = count;
          break;
        default:
          break;
      }
    }

    const statusLabels: Record<StatusKey, string> = {
      DRAFT: "Brouillons",
      PUBLISHED: "Publiés",
      ARCHIVED: "Archivés",
    } as const;

    const distribution = (Object.keys(statusLabels) as StatusKey[]).map((status) => {
      const count =
        status === "DRAFT"
          ? totals.draft
          : status === "PUBLISHED"
          ? totals.published
          : totals.archived;

      return {
        status,
        label: statusLabels[status],
        count,
        percentage: totals.all === 0 ? 0 : Number(((count / totals.all) * 100).toFixed(1)),
      };
    });

    const timelineMap = new Map<string, number>();
    for (const row of timelineRows) {
      const isoDate = row.date.toISOString().slice(0, 10);
      timelineMap.set(isoDate, Number(row.count));
    }

    const timeline: Array<{ date: string; count: number }> = [];
    for (let i = 0; i < windowDays; i += 1) {
      const current = new Date(startDate);
      current.setUTCDate(startDate.getUTCDate() + i);
      const isoDate = current.toISOString().slice(0, 10);
      timeline.push({
        date: isoDate,
        count: timelineMap.get(isoDate) ?? 0,
      });
    }

    return {
      generatedAt: now.toISOString(),
      totals,
      statusDistribution: distribution,
      recentReports: recentReports.map((report) => ({
        id: report.id,
        title: report.title,
        status: report.status,
        issuedAt: report.issuedAt,
        updatedAt: report.updatedAt,
        owner: {
          id: report.owner.id,
          firstName: report.owner.firstName,
          lastName: report.owner.lastName,
        },
      })),
      timeline,
    } as const;
  }

  static async createReport(input: CreateReportInput, ownerId: string) {
    const data = {
      title: input.title,
      caseNumber: input.caseNumber ?? null,
      reportNumber: input.reportNumber ?? null,
      purpose: input.purpose ?? null,
      summary: input.summary ?? null,
      relatedCases: input.relatedCases ?? undefined,
      requestingService: input.requestingService ?? null,
      reportingUnit: input.reportingUnit ?? null,
      reportingOfficer: input.reportingOfficer ?? null,
      reportingRank: input.reportingRank ?? null,
      issuedAt: input.issuedAt ?? undefined,
      objectives: input.objectives ?? undefined,
      status: input.status ?? "DRAFT",
      owner: {
        connect: { id: ownerId },
      },
      dateRangeStart: input.dateRangeStart ?? null,
      dateRangeEnd: input.dateRangeEnd ?? null,
    };

    const report = await prisma.report.create({ data });
    
    // Indexer le rapport dans Meilisearch (async, sans bloquer)
    SearchService.indexReport(report.id).catch((error) => {
      logger.warn({ err: error, reportId: report.id }, "⚠️  Échec d'indexation du rapport");
    });
    
    return report;
  }

  static async getReport(reportId: string) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        modules: {
          orderBy: { position: "asc" },
          include: {
            entity: true,
            attachments: true,
            researchItems: {
              include: {
                entity: true,
                researchType: true,
              },
            },
          },
        },
        attachments: true,
      },
    });

    if (!report) {
      throw createError(404, "Rapport introuvable");
    }

    const [reportLevelAttachments, moduleWithSecrets] = await Promise.all([
      Promise.all(
        report.attachments.map((attachment: typeof report.attachments[number]) =>
          this.resolveAttachmentSecret(attachment)
        )
      ),
      Promise.all(
  report.modules.map(async (module: typeof report.modules[number]) => {
          const withAttachments = await this.resolveAttachments(module);
          return withAttachments;
        })
      ),
    ]);

    return {
      ...report,
      attachments: reportLevelAttachments,
      modules: moduleWithSecrets,
    };
  }

  static async updateReport(reportId: string, input: UpdateReportInput) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      throw createError(404, "Rapport introuvable");
    }

    const data = {
      ...("title" in input ? { title: input.title ?? report.title } : {}),
      ...("caseNumber" in input ? { caseNumber: input.caseNumber ?? null } : {}),
      ...("reportNumber" in input ? { reportNumber: input.reportNumber ?? null } : {}),
      ...("purpose" in input ? { purpose: input.purpose ?? null } : {}),
      ...("summary" in input ? { summary: input.summary ?? null } : {}),
      ...("relatedCases" in input ? { relatedCases: input.relatedCases } : {}),
      ...("requestingService" in input
        ? { requestingService: input.requestingService ?? null }
        : {}),
      ...("reportingUnit" in input ? { reportingUnit: input.reportingUnit ?? null } : {}),
      ...("reportingOfficer" in input ? { reportingOfficer: input.reportingOfficer ?? null } : {}),
      ...("reportingRank" in input ? { reportingRank: input.reportingRank ?? null } : {}),
      ...("issuedAt" in input ? { issuedAt: input.issuedAt ?? report.issuedAt ?? undefined } : {}),
      ...("objectives" in input ? { objectives: input.objectives } : {}),
      ...("status" in input ? { status: input.status ?? report.status } : {}),
      ...("dateRangeStart" in input ? { dateRangeStart: input.dateRangeStart ?? null } : {}),
      ...("dateRangeEnd" in input ? { dateRangeEnd: input.dateRangeEnd ?? null } : {}),
    };

    const updatedReport = await prisma.report.update({ where: { id: reportId }, data });
    
    // Réindexer le rapport dans Meilisearch (async, sans bloquer)
    SearchService.indexReport(reportId).catch((error) => {
      logger.warn({ err: error, reportId }, "⚠️  Échec de réindexation du rapport");
    });
    
    return updatedReport;
  }

  static async listModules(reportId: string) {
    await ReportService.ensureReportExists(reportId);

    return prisma.reportModule.findMany({
      where: { reportId },
      include: {
        entity: {
          select: {
            id: true,
            label: true,
            type: true,
          },
        },
      },
      orderBy: { position: "asc" },
    });
  }

  static async createModule(reportId: string, input: CreateModuleInput) {
    await ReportService.ensureReportExists(reportId);

    if (input.slug) {
      const existingSlug = await prisma.reportModule.findFirst({
        where: { reportId, slug: input.slug },
      });
      if (existingSlug) {
        throw createError(409, "Slug de module déjà utilisé pour ce rapport");
      }
    }

    if (input.entityId) {
      const entityExists = await prisma.entity.findUnique({ where: { id: input.entityId } });
      if (!entityExists) {
        throw createError(400, "Entité référencée introuvable");
      }
    }

    return prisma.reportModule.create({
      data: {
        reportId,
        type: input.type,
        slug: input.slug,
        title: input.title,
        headline: input.headline,
        entityId: input.entityId ?? null,
        position: input.position ?? 0,
        payload: input.payload ?? undefined,
      },
    });
  }

  static async updateModule(reportId: string, moduleId: string, input: UpdateModuleInput) {
    const module = await prisma.reportModule.findUnique({ where: { id: moduleId } });
    if (!module || module.reportId !== reportId) {
      throw createError(404, "Module introuvable pour ce rapport");
    }

    if (input.slug && input.slug !== module.slug) {
      const existingSlug = await prisma.reportModule.findFirst({
        where: { reportId, slug: input.slug },
      });
      if (existingSlug) {
        throw createError(409, "Slug de module déjà utilisé pour ce rapport");
      }
    }

    if (input.entityId) {
      const entityExists = await prisma.entity.findUnique({ where: { id: input.entityId } });
      if (!entityExists) {
        throw createError(400, "Entité référencée introuvable");
      }
    }

    return prisma.reportModule.update({
      where: { id: moduleId },
      data: {
        type: input.type ?? undefined,
        slug: input.slug ?? undefined,
        title: "title" in input ? input.title ?? null : undefined,
        headline: "headline" in input ? input.headline ?? null : undefined,
        entityId: "entityId" in input ? input.entityId ?? null : undefined,
        position: input.position ?? undefined,
        payload: "payload" in input ? input.payload ?? undefined : undefined,
      },
    });
  }

  static async deleteModule(reportId: string, moduleId: string) {
    const module = await prisma.reportModule.findUnique({ where: { id: moduleId } });
    if (!module || module.reportId !== reportId) {
      throw createError(404, "Module introuvable pour ce rapport");
    }

    const attachments = await prisma.reportAttachment.findMany({ where: { moduleId } });
    await Promise.all(
      attachments.map((attachment: (typeof attachments)[number]) =>
        VaultService.deletePointer(attachment.storageKey)
      )
    );

    await prisma.reportAttachment.deleteMany({ where: { moduleId } });
    await prisma.researchRecord.deleteMany({ where: { reportModuleId: moduleId } });

    await prisma.reportModule.delete({ where: { id: moduleId } });
  }

  static async registerAttachment(reportId: string, input: RegisterAttachmentInput) {
    await ReportService.ensureReportExists(reportId);

    if (input.moduleId) {
      const module = await prisma.reportModule.findUnique({ where: { id: input.moduleId } });
      if (!module || module.reportId !== reportId) {
        throw createError(400, "Module introuvable pour ce rapport");
      }
    }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const vaultItem = await VaultService.storeString(
        reportId,
        "reportAttachment.storageKey",
        input.storageKey,
        { expiresAt: input.expiresAt ?? null },
        tx
      );

      const storagePointer = VaultService.buildPointer(vaultItem.id);

      const attachment = await tx.reportAttachment.create({
        data: {
          reportId,
          moduleId: input.moduleId ?? null,
          type: input.type,
          storageKey: storagePointer,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          caption: input.caption ?? null,
          expiresAt: input.expiresAt ?? null,
        },
      });

      return this.resolveAttachmentSecret(attachment, tx);
    });
  }

  private static async ensureReportExists(reportId: string) {
    const exists = await prisma.report.findUnique({ where: { id: reportId }, select: { id: true } });
    if (!exists) {
      throw createError(404, "Rapport introuvable");
    }
  }

  /**
   * Réorganise les modules d'un rapport
   */
  static async reorderModules(reportId: string, moduleIds: string[]) {
    await this.ensureReportExists(reportId);

    // Vérifier que tous les modules appartiennent au rapport
    const modules = await prisma.reportModule.findMany({
      where: {
        id: { in: moduleIds },
        reportId,
      },
      select: { id: true },
    });

    if (modules.length !== moduleIds.length) {
      throw createError(400, "Certains modules n'appartiennent pas à ce rapport");
    }

    // Mettre à jour les positions en une transaction
    await prisma.$transaction(
      moduleIds.map((moduleId, index) =>
        prisma.reportModule.update({
          where: { id: moduleId },
          data: { position: index },
        })
      )
    );

    return { success: true, message: 'Modules réorganisés avec succès' };
  }

  /**
   * Change le statut d'un rapport (DRAFT -> PUBLISHED -> ARCHIVED)
   */
  static async updateStatus(
    reportId: string,
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  ) {
    await this.ensureReportExists(reportId);

    return prisma.report.update({
      where: { id: reportId },
      data: { status },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Duplique un rapport (création d'une copie en DRAFT)
   */
  static async duplicate(reportId: string, ownerId: string) {
    const original = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        modules: {
          include: {
            researchItems: true,
          },
        },
      },
    });

    if (!original) {
      throw createError(404, "Rapport introuvable");
    }

    return prisma.$transaction(async (tx) => {
      // Créer le nouveau rapport
      const newReport = await tx.report.create({
        data: {
          title: `${original.title} (Copie)`,
          caseNumber: original.caseNumber,
          reportNumber: null, // Nouveau numéro nécessaire
          purpose: original.purpose,
          summary: original.summary,
          relatedCases: original.relatedCases,
          requestingService: original.requestingService,
          reportingUnit: original.reportingUnit,
          reportingOfficer: original.reportingOfficer,
          reportingRank: original.reportingRank,
          objectives: original.objectives,
          status: 'DRAFT', // Toujours en brouillon
          ownerId,
          dateRangeStart: original.dateRangeStart,
          dateRangeEnd: original.dateRangeEnd,
          investigationContext: original.investigationContext,
          legalBasis: original.legalBasis,
          urgencyLevel: original.urgencyLevel,
          classification: original.classification,
          keywords: original.keywords,
        },
      });

      // Copier les modules
      for (const module of original.modules) {
        const newModule = await tx.reportModule.create({
          data: {
            reportId: newReport.id,
            type: module.type,
            slug: module.slug,
            title: module.title,
            headline: module.headline,
            entityId: module.entityId,
            position: module.position,
            payload: module.payload,
          },
        });

        // Copier les research records
        for (const record of module.researchItems) {
          await tx.researchRecord.create({
            data: {
              reportModuleId: newModule.id,
              entityId: record.entityId,
              researchTypeId: record.researchTypeId,
              subtitle: record.subtitle,
              details: record.details,
              // Ne pas copier sensitiveDataRef pour sécurité
            },
          });
        }
      }

      return newReport;
    });
  }

  /**
   * Récupère les statistiques d'un rapport
   */
  static async getReportStats(reportId: string) {
    await this.ensureReportExists(reportId);

    const [
      modulesCount,
      entitiesCount,
      researchRecordsCount,
      attachmentsCount,
      correlationsCount,
    ] = await Promise.all([
      prisma.reportModule.count({ where: { reportId } }),
      prisma.reportModule.count({
        where: { reportId, entityId: { not: null } },
      }),
      prisma.researchRecord.count({
        where: { module: { reportId } },
      }),
      prisma.reportAttachment.count({ where: { reportId } }),
      prisma.reportCorrelation.count({
        where: {
          OR: [{ sourceReportId: reportId }, { relatedReportId: reportId }],
        },
      }),
    ]);

    return {
      modules: modulesCount,
      entities: entitiesCount,
      researchRecords: researchRecordsCount,
      attachments: attachmentsCount,
      correlations: correlationsCount,
    };
  }
}
