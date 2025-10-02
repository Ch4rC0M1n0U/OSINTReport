import { Request, Response } from "express";
import createError from "http-errors";
import { SmtpService } from "./smtp.service";
import { smtpConfigSchema, smtpTestSchema } from "./smtp.validation";

export class SmtpController {
  /**
   * GET /api/smtp/config
   * Récupère la configuration SMTP active
   */
  static async getActiveConfig(req: Request, res: Response) {
    const config = await SmtpService.getActiveConfig();

    if (!config) {
      return res.status(404).json({ message: "Aucune configuration SMTP active" });
    }

    res.json({ config });
  }

  /**
   * GET /api/smtp/configs
   * Récupère toutes les configurations SMTP
   */
  static async getAllConfigs(req: Request, res: Response) {
    const configs = await SmtpService.getAllConfigs();
    res.json({ configs });
  }

  /**
   * POST /api/smtp/config
   * Crée une nouvelle configuration SMTP
   */
  static async createConfig(req: Request, res: Response) {
    const payload = smtpConfigSchema.parse(req.body);
    const config = await SmtpService.createConfig(payload);

    res.status(201).json({ config });
  }

  /**
   * PUT /api/smtp/config/:id
   * Met à jour une configuration SMTP
   */
  static async updateConfig(req: Request, res: Response) {
    const { id } = req.params;
    const payload = smtpConfigSchema.partial().parse(req.body);

    const config = await SmtpService.updateConfig(id, payload);

    res.json({ config });
  }

  /**
   * DELETE /api/smtp/config/:id
   * Supprime une configuration SMTP
   */
  static async deleteConfig(req: Request, res: Response) {
    const { id } = req.params;
    await SmtpService.deleteConfig(id);

    res.status(204).send();
  }

  /**
   * POST /api/smtp/test
   * Teste une configuration SMTP
   */
  static async testConnection(req: Request, res: Response) {
    const payload = smtpTestSchema.parse(req.body);
    const result = await SmtpService.testConnection(payload);

    res.json(result);
  }

  /**
   * POST /api/smtp/config/:id/activate
   * Active une configuration SMTP spécifique
   */
  static async activateConfig(req: Request, res: Response) {
    const { id } = req.params;
    const config = await SmtpService.activateConfig(id);

    res.json({ config });
  }
}
