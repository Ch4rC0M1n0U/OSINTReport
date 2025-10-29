import { NextFunction, Request, Response } from "express";

import { ReportService } from "@modules/reports/report.service";
import { EntityService } from "@modules/reports/entity.service";
import { ResearchRecordService } from "@modules/reports/research-record.service";
import {
  createModuleSchema,
  createReportSchema,
  listReportsQuerySchema,
  registerAttachmentSchema,
  updateModuleSchema,
  updateReportSchema,
  reorderModulesSchema,
  updateReportStatusSchema,
  createEntitySchema,
  updateEntitySchema,
  createResearchRecordSchema,
  updateResearchRecordSchema,
  validateModulePayload, // Nouveau import pour validation des payloads
  validateReportSchema,
} from "@modules/reports/report.validation";

export class ReportController {
  static async dashboard(_req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await ReportService.getDashboardSummary();
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listReportsQuerySchema.parse(req.query);
      const result = await ReportService.listReports(query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = createReportSchema.parse(req.body);
      if (!req.user) {
        throw new Error("Utilisateur non authentifié");
      }
      const report = await ReportService.createReport(payload, req.user.id);
      res.status(201).json({ report });
    } catch (error) {
      next(error);
    }
  }

  static async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await ReportService.getReport(req.params.reportId);
      res.json({ report });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = updateReportSchema.parse(req.body);
      const report = await ReportService.updateReport(req.params.reportId, payload, req.user?.id);
      res.json({ report });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ReportService.deleteReport(req.params.reportId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async listModules(req: Request, res: Response, next: NextFunction) {
    try {
      const modules = await ReportService.listModules(req.params.reportId);
      res.json({ modules });
    } catch (error) {
      next(error);
    }
  }

  static async createModule(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = createModuleSchema.parse(req.body);
      
      // Validation du payload selon le type de module
      if (payload.payload) {
        const validatedPayload = validateModulePayload(payload.type, payload.payload);
        payload.payload = validatedPayload;
      }
      
      const module = await ReportService.createModule(req.params.reportId, payload);
      res.status(201).json({ module });
    } catch (error) {
      next(error);
    }
  }

  static async updateModule(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = updateModuleSchema.parse(req.body);
      
      // Validation du payload selon le type de module (si fourni)
      if (payload.type && payload.payload) {
        const validatedPayload = validateModulePayload(payload.type, payload.payload);
        payload.payload = validatedPayload;
      }
      
      const module = await ReportService.updateModule(
        req.params.reportId,
        req.params.moduleId,
        payload
      );
      res.json({ module });
    } catch (error) {
      next(error);
    }
  }

  static async deleteModule(req: Request, res: Response, next: NextFunction) {
    try {
      await ReportService.deleteModule(req.params.reportId, req.params.moduleId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async registerAttachment(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = registerAttachmentSchema.parse(req.body);
      const attachment = await ReportService.registerAttachment(req.params.reportId, payload);
      res.status(201).json({ attachment });
    } catch (error) {
      next(error);
    }
  }

  static async reorderModules(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = reorderModulesSchema.parse(req.body);
      const result = await ReportService.reorderModules(
        req.params.reportId,
        payload.moduleIds
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = updateReportStatusSchema.parse(req.body);
      const report = await ReportService.updateStatus(req.params.reportId, payload.status);
      res.json({ report });
    } catch (error) {
      next(error);
    }
  }

  static async duplicate(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error("Utilisateur non authentifié");
      }
      const report = await ReportService.duplicate(req.params.reportId, req.user.id);
      res.status(201).json({ report });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await ReportService.getReportStats(req.params.reportId);
      res.json({ stats });
    } catch (error) {
      next(error);
    }
  }

  // ===== Contrôleurs pour les entités =====

  static async createEntity(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = createEntitySchema.parse(req.body);
      const entity = await EntityService.create(payload);
      res.status(201).json({ entity });
    } catch (error) {
      next(error);
    }
  }

  static async listEntities(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, search, limit, offset } = req.query;
      const result = await EntityService.list({
        type: type as any,
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getEntity(req: Request, res: Response, next: NextFunction) {
    try {
      const entity = await EntityService.findById(req.params.entityId);
      if (!entity) {
        res.status(404).json({ message: "Entité introuvable" });
        return;
      }
      res.json({ entity });
    } catch (error) {
      next(error);
    }
  }

  static async updateEntity(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = updateEntitySchema.parse(req.body);
      const entity = await EntityService.update(req.params.entityId, payload);
      res.json({ entity });
    } catch (error) {
      next(error);
    }
  }

  static async deleteEntity(req: Request, res: Response, next: NextFunction) {
    try {
      await EntityService.delete(req.params.entityId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async searchEntities(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, type, limit } = req.query;
      if (!q) {
        res.status(400).json({ message: "Paramètre 'q' requis" });
        return;
      }
      const entities = await EntityService.search(
        q as string,
        type as any,
        limit ? parseInt(limit as string) : undefined
      );
      res.json({ entities });
    } catch (error) {
      next(error);
    }
  }

  // ===== Contrôleurs pour les enregistrements de recherche =====

  static async createResearchRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = createResearchRecordSchema.parse(req.body);
      const record = await ResearchRecordService.create(
        req.params.moduleId,
        payload
      );
      res.status(201).json({ record });
    } catch (error) {
      next(error);
    }
  }

  static async listResearchRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const records = await ResearchRecordService.listByModule(req.params.moduleId);
      res.json({ records });
    } catch (error) {
      next(error);
    }
  }

  static async getResearchRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await ResearchRecordService.findById(req.params.recordId);
      if (!record) {
        res.status(404).json({ message: "Enregistrement introuvable" });
        return;
      }
      res.json({ record });
    } catch (error) {
      next(error);
    }
  }

  static async updateResearchRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = updateResearchRecordSchema.parse(req.body);
      const record = await ResearchRecordService.update(req.params.recordId, payload);
      res.json({ record });
    } catch (error) {
      next(error);
    }
  }

  static async deleteResearchRecord(req: Request, res: Response, next: NextFunction) {
    try {
      await ResearchRecordService.delete(req.params.recordId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async listResearchTypes(_req: Request, res: Response, next: NextFunction) {
    try {
      const types = await ResearchRecordService.listResearchTypes();
      res.json({ types });
    } catch (error) {
      next(error);
    }
  }

  // Validation par l'officier
  static async validateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = validateReportSchema.parse(req.body);
      if (!req.user) {
        throw new Error("Utilisateur non authentifié");
      }
      const report = await ReportService.validateReport(
        req.params.reportId,
        req.user.id,
        payload.validatorNotes
      );
      res.json({ report });
    } catch (error) {
      next(error);
    }
  }

  static async removeValidation(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await ReportService.removeValidation(req.params.reportId);
      res.json({ report });
    } catch (error) {
      next(error);
    }
  }
}
