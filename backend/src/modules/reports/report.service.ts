import createError from "http-errors";
import { prisma } from "@shared/prisma";
import {
  CreateModuleInput,
  CreateReportInput,
  ListReportsQuery,
  RegisterAttachmentInput,
  UpdateModuleInput,
  UpdateReportInput,
} from "@modules/reports/report.validation";

export class ReportService {
  static async listReports(query: ListReportsQuery) {
    const { limit, offset, orderBy, order, status, search } = query;

    type ReportWhereInput = NonNullable<Parameters<typeof prisma.report.findMany>[0]>["where"];
    const where: ReportWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { caseNumber: { contains: search, mode: "insensitive" } },
        { reportNumber: { contains: search, mode: "insensitive" } },
        { requestingService: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.report.findMany({
        where,
        orderBy: {
          [orderBy ?? "issuedAt"]: order,
        } as NonNullable<Parameters<typeof prisma.report.findMany>[0]>["orderBy"],
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

    return prisma.report.create({ data });
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

    return report;
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

    return prisma.report.update({ where: { id: reportId }, data });
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

    return prisma.reportAttachment.create({
      data: {
        reportId,
        moduleId: input.moduleId ?? null,
        type: input.type,
        storageKey: input.storageKey,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        caption: input.caption ?? null,
        expiresAt: input.expiresAt ?? null,
      },
    });
  }

  private static async ensureReportExists(reportId: string) {
    const exists = await prisma.report.findUnique({ where: { id: reportId }, select: { id: true } });
    if (!exists) {
      throw createError(404, "Rapport introuvable");
    }
  }
}
