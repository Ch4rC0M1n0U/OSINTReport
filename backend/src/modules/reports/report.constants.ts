export const REPORT_MODULE_TYPES = [
  "summary",
  "entities",
  "objectives",
  "research-summary",
  "research-detail",
  "identifier-lookup",
  "media-gallery",
  "data-retention",
  "conclusions",
  "investigation",
  "sign-off",
] as const;

export type ReportModuleType = (typeof REPORT_MODULE_TYPES)[number];

export const REPORT_ATTACHMENT_TYPES = ["image", "document", "link"] as const;
export type ReportAttachmentType = (typeof REPORT_ATTACHMENT_TYPES)[number];

export const REPORT_ORDERABLE_FIELDS = ["issuedAt", "createdAt", "updatedAt"] as const;
export type ReportOrderField = (typeof REPORT_ORDERABLE_FIELDS)[number];
