import { z } from "zod";

import {
  REPORT_ATTACHMENT_TYPES,
  REPORT_MODULE_TYPES,
  REPORT_ORDERABLE_FIELDS,
} from "@modules/reports/report.constants";

const optionalDate = z
  .union([z.string().datetime({ offset: true }).or(z.string().datetime()), z.date()])
  .optional()
  .transform((value) => {
    if (!value) return undefined;
    return value instanceof Date ? value : new Date(value);
  });

const objectivesSchema = z.array(z.string().trim().min(1)).nonempty().optional();

export const createReportSchema = z
  .object({
    title: z.string().min(3).max(255),
    caseNumber: z.string().trim().max(100).optional(),
    reportNumber: z.string().trim().max(50).optional(),
    summary: z.string().optional(),
    purpose: z.string().optional(),
    relatedCases: z.array(z.string().trim().max(120)).optional(),
    requestingService: z.string().trim().max(150).optional(),
    reportingUnit: z.string().trim().max(150).optional(),
    reportingOfficer: z.string().trim().max(150).optional(),
    reportingRank: z.string().trim().max(100).optional(),
    issuedAt: optionalDate,
    dateRangeStart: optionalDate,
    dateRangeEnd: optionalDate,
    objectives: objectivesSchema,
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
    // Nouveaux champs OSINT
    investigationContext: z.string().trim().max(500).optional(),
    legalBasis: z.string().trim().max(500).optional(),
    urgencyLevel: z.enum(["ROUTINE", "URGENT", "CRITICAL"]).optional(),
    classification: z.enum(["PUBLIC", "RESTRICTED", "CONFIDENTIAL", "SECRET"]).optional(),
    keywords: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  })
  .strict();

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const updateReportSchema = createReportSchema.partial().extend({
  title: z.string().min(3).max(255).optional(),
});
export type UpdateReportInput = z.infer<typeof updateReportSchema>;

export const modulePayloadSchema = z.record(z.string(), z.any()).optional();

export const createModuleSchema = z
  .object({
    type: z.enum(REPORT_MODULE_TYPES),
    slug: z.string().trim().min(1).max(120).optional(),
    title: z.string().trim().max(255).optional(),
    headline: z.string().trim().max(255).optional(),
    entityId: z.string().uuid().optional(),
    position: z.number().int().min(0).optional(),
    payload: modulePayloadSchema,
  })
  .strict();
export type CreateModuleInput = z.infer<typeof createModuleSchema>;

export const updateModuleSchema = createModuleSchema.partial().extend({
  type: z.enum(REPORT_MODULE_TYPES).optional(),
});
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;

export const registerAttachmentSchema = z
  .object({
    moduleId: z.string().uuid().optional(),
    type: z.enum(REPORT_ATTACHMENT_TYPES).default("image"),
    storageKey: z.string().min(1),
    fileName: z.string().min(1),
    mimeType: z.string().min(1),
    fileSize: z.number().int().positive(),
    caption: z.string().optional(),
    expiresAt: optionalDate,
  })
  .strict();
export type RegisterAttachmentInput = z.infer<typeof registerAttachmentSchema>;

export const listReportsQuerySchema = z
  .object({
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
    search: z.string().trim().min(2).optional(),
    orderBy: z.enum(REPORT_ORDERABLE_FIELDS).optional(),
    order: z.enum(["asc", "desc"]).default("desc"),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .strict();
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;

// Schémas pour les entités
export const createEntitySchema = z
  .object({
    label: z.string().min(1).max(255),
    type: z.enum([
      "PERSON",
      "ORGANIZATION",
      "TELEPHONE",
      "EMAIL",
      "ACCOUNT",
      "ADDRESS",
      "OTHER",
    ]),
    notes: z.string().optional(),
  })
  .strict();
export type CreateEntityInput = z.infer<typeof createEntitySchema>;

export const updateEntitySchema = createEntitySchema.partial().extend({
  label: z.string().min(1).max(255).optional(),
});
export type UpdateEntityInput = z.infer<typeof updateEntitySchema>;

// Schémas pour les enregistrements de recherche
export const createResearchRecordSchema = z
  .object({
    researchTypeId: z.string().uuid(),
    entityId: z.string().uuid().optional(),
    subtitle: z.string().max(255).optional(),
    details: z.record(z.string(), z.any()).optional(),
    sensitiveDataRef: z.string().uuid().optional(),
  })
  .strict();
export type CreateResearchRecordInput = z.infer<
  typeof createResearchRecordSchema
>;

export const updateResearchRecordSchema = createResearchRecordSchema
  .partial()
  .extend({
    researchTypeId: z.string().uuid().optional(),
  });
export type UpdateResearchRecordInput = z.infer<
  typeof updateResearchRecordSchema
>;

// Schéma pour réorganiser les modules
export const reorderModulesSchema = z
  .object({
    moduleIds: z.array(z.string().uuid()).min(1),
  })
  .strict();
export type ReorderModulesInput = z.infer<typeof reorderModulesSchema>;

// Schéma pour publier/archiver un rapport
export const updateReportStatusSchema = z
  .object({
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  })
  .strict();
export type UpdateReportStatusInput = z.infer<typeof updateReportStatusSchema>;
