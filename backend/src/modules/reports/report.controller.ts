import { NextFunction, Request, Response } from "express";

import { ReportService } from "@modules/reports/report.service";
import {
  createModuleSchema,
  createReportSchema,
  listReportsQuerySchema,
  registerAttachmentSchema,
  updateModuleSchema,
  updateReportSchema,
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
      const report = await ReportService.updateReport(req.params.reportId, payload);
      res.json({ report });
    } catch (error) {
      next(error);
    }
  }

  static async createModule(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = createModuleSchema.parse(req.body);
      const module = await ReportService.createModule(req.params.reportId, payload);
      res.status(201).json({ module });
    } catch (error) {
      next(error);
    }
  }

  static async updateModule(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = updateModuleSchema.parse(req.body);
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
}
