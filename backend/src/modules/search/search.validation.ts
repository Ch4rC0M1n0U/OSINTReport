import { z } from "zod";

export const searchSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  urgencyLevel: z.enum(["ROUTINE", "URGENT", "CRITICAL"]).optional(),
  classification: z.enum(["PUBLIC", "CONFIDENTIAL", "SECRET"]).optional(),
  sort: z.enum(["createdAt:asc", "createdAt:desc", "updatedAt:asc", "updatedAt:desc", "title:asc", "title:desc"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type SearchQuery = z.infer<typeof searchSchema>;
