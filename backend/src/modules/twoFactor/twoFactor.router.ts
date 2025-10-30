import { Router } from "express";
import { requireAuth } from "@middleware/authenticate";
import { TwoFactorController } from "./twoFactor.controller";

const twoFactorRouter = Router();

// Toutes les routes nécessitent l'authentification
twoFactorRouter.use(requireAuth);

// Générer un secret 2FA
twoFactorRouter.post("/generate", TwoFactorController.generateSecret);

// Activer la 2FA
twoFactorRouter.post("/enable", TwoFactorController.enable);

// Désactiver la 2FA
twoFactorRouter.post("/disable", TwoFactorController.disable);

// Vérifier un token 2FA
twoFactorRouter.post("/verify", TwoFactorController.verify);

// Statut de la 2FA
twoFactorRouter.get("/status", TwoFactorController.getStatus);

export { twoFactorRouter };
