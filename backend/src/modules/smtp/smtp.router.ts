import { Router } from "express";
import { requireAuth, requirePermissions } from "@middleware/authenticate";
import { PermissionCode } from "@modules/auth/auth.constants";
import { SmtpController } from "./smtp.controller";
import { checkMaintenanceMode } from "@middleware/maintenance";

const smtpRouter = Router();

// Toutes les routes SMTP nécessitent les permissions admin
smtpRouter.use(requireAuth, requirePermissions(PermissionCode.ADMIN));
smtpRouter.use(checkMaintenanceMode);

smtpRouter.get("/config", SmtpController.getActiveConfig);
smtpRouter.get("/configs", SmtpController.getAllConfigs);
smtpRouter.post("/config", SmtpController.createConfig);
smtpRouter.put("/config/:id", SmtpController.updateConfig);
smtpRouter.delete("/config/:id", SmtpController.deleteConfig);
smtpRouter.post("/test", SmtpController.testConnection);
smtpRouter.post("/config/:id/activate", SmtpController.activateConfig);

export { smtpRouter };
