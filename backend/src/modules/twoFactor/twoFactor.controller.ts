import { Request, Response } from "express";
import { TwoFactorService } from "./twoFactor.service";
import { z } from "zod";

const enableSchema = z.object({
  secret: z.string(),
  token: z.string().length(6),
});

const verifySchema = z.object({
  token: z.string().length(6),
});

export class TwoFactorController {
  /**
   * POST /api/2fa/generate
   * Génère un secret 2FA et un QR code
   */
  static async generateSecret(req: Request, res: Response) {
    const userId = req.user!.id;

    const result = await TwoFactorService.generateSecret(userId);

    res.json(result);
  }

  /**
   * POST /api/2fa/enable
   * Active l'authentification à deux facteurs
   */
  static async enable(req: Request, res: Response) {
    const userId = req.user!.id;
    const payload = enableSchema.parse(req.body);

    await TwoFactorService.enable(userId, payload.secret, payload.token);

    res.json({ message: "Authentification à deux facteurs activée avec succès" });
  }

  /**
   * POST /api/2fa/disable
   * Désactive l'authentification à deux facteurs
   */
  static async disable(req: Request, res: Response) {
    const userId = req.user!.id;
    const payload = verifySchema.parse(req.body);

    await TwoFactorService.disable(userId, payload.token);

    res.json({ message: "Authentification à deux facteurs désactivée avec succès" });
  }

  /**
   * POST /api/2fa/verify
   * Vérifie un token 2FA
   */
  static async verify(req: Request, res: Response) {
    const userId = req.user!.id;
    const payload = verifySchema.parse(req.body);

    const isValid = await TwoFactorService.verifyToken(userId, payload.token);

    res.json({ valid: isValid });
  }

  /**
   * GET /api/2fa/status
   * Vérifie si la 2FA est activée pour l'utilisateur
   */
  static async getStatus(req: Request, res: Response) {
    const userId = req.user!.id;

    const enabled = await TwoFactorService.isEnabled(userId);

    res.json({ enabled });
  }
}
