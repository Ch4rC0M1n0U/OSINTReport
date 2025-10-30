import { Request, Response } from "express";
import { AuditService, AuditAction, AuditResource } from "./audit.service";

/**
 * Vérifier si l'utilisateur a au moins une des permissions requises
 */
function hasPermission(user: any, permissions: string[]): boolean {
  if (!user || !user.permissions) {
    return false;
  }
  return permissions.some((permission) => user.permissions.includes(permission));
}

export class AuditController {
  /**
   * Récupérer les logs d'audit
   */
  static async getLogs(req: Request, res: Response): Promise<void> {
    try {
      // Vérifier les permissions
      if (!hasPermission(req.user, ["system:admin", "audit:read"])) {
        res.status(403).json({ error: "Accès refusé" });
        return;
      }

      const {
        page,
        limit,
        userId,
        action,
        resource,
        resourceId,
        startDate,
        endDate,
        search,
      } = req.query;

      const result = await AuditService.getLogs({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        userId: userId as string,
        action: action as string,
        resource: resource as string,
        resourceId: resourceId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        search: search as string,
      });

      res.json(result);
    } catch (error) {
      console.error("Erreur lors de la récupération des logs:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }

  /**
   * Récupérer les statistiques des logs
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      // Vérifier les permissions
      if (!hasPermission(req.user, ["system:admin", "audit:read"])) {
        res.status(403).json({ error: "Accès refusé" });
        return;
      }

      const { startDate, endDate } = req.query;

      const stats = await AuditService.getStats({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.json(stats);
    } catch (error) {
      console.error("Erreur lors de la récupération des stats:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }

  /**
   * Récupérer la liste des actions disponibles
   */
  static async getActions(req: Request, res: Response): Promise<void> {
    try {
      // Vérifier les permissions
      if (!hasPermission(req.user, ["system:admin", "audit:read"])) {
        res.status(403).json({ error: "Accès refusé" });
        return;
      }

      // Retourner toutes les valeurs de l'enum AuditAction
      const actions = Object.values(AuditAction);
      res.json(actions);
    } catch (error) {
      console.error("Erreur lors de la récupération des actions:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }

  /**
   * Récupérer la liste des ressources disponibles
   */
  static async getResources(req: Request, res: Response): Promise<void> {
    try {
      // Vérifier les permissions
      if (!hasPermission(req.user, ["system:admin", "audit:read"])) {
        res.status(403).json({ error: "Accès refusé" });
        return;
      }

      // Retourner toutes les valeurs de l'enum AuditResource
      const resources = Object.values(AuditResource);
      res.json(resources);
    } catch (error) {
      console.error("Erreur lors de la récupération des ressources:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
}
