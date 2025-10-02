import { z } from 'zod';
import { CorrelationType } from './correlation.types';

export const correlationCheckSchema = z.object({
  reportId: z.string().uuid('ID de rapport invalide'),
  value: z.string().min(1, 'La valeur à vérifier est requise'),
  type: z.nativeEnum(CorrelationType, {
    message: 'Type de corrélation invalide',
  }),
});

export const createCorrelationSchema = z.object({
  sourceReportId: z.string().uuid('ID de rapport source invalide'),
  relatedReportId: z.string().uuid('ID de rapport relié invalide'),
  correlationType: z.nativeEnum(CorrelationType, {
    message: 'Type de corrélation invalide',
  }),
  correlationData: z.object({
    value: z.string(),
    context: z.string().optional(),
    extractedFrom: z.string().optional(),
  }),
  confidence: z.number().min(0).max(1),
  notes: z.string().optional(),
});

export const verifyCorrelationSchema = z.object({
  notes: z.string().optional(),
});

export const getCorrelationsQuerySchema = z.object({
  reportId: z.string().uuid().optional(),
  type: z.nativeEnum(CorrelationType).optional(),
  minConfidence: z.coerce.number().min(0).max(1).optional(),
  verified: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});
