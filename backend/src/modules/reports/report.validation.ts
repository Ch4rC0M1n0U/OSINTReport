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
