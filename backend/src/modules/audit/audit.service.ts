import { Request, Response, NextFunction } from "express";
import { prisma } from "../../shared/prisma";

/**
 * Types d'actions pour l'audit
 */
export enum AuditAction {
  // Authentification
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  LOGIN_FAILED = "LOGIN_FAILED",
  PASSWORD_RESET_REQUEST = "PASSWORD_RESET_REQUEST",
  PASSWORD_RESET_COMPLETE = "PASSWORD_RESET_COMPLETE",
  
  // 2FA
  TWO_FACTOR_ENABLE = "TWO_FACTOR_ENABLE",
  TWO_FACTOR_DISABLE = "TWO_FACTOR_DISABLE",
  TWO_FACTOR_VERIFY = "TWO_FACTOR_VERIFY",
  
  // Utilisateurs
  USER_CREATE = "USER_CREATE",
  USER_UPDATE = "USER_UPDATE",
  USER_DELETE = "USER_DELETE",
  USER_SUSPEND = "USER_SUSPEND",
  USER_ACTIVATE = "USER_ACTIVATE",
  USER_VIEW = "USER_VIEW",
  
  // Rapports
  REPORT_CREATE = "REPORT_CREATE",
  REPORT_UPDATE = "REPORT_UPDATE",
  REPORT_DELETE = "REPORT_DELETE",
  REPORT_PUBLISH = "REPORT_PUBLISH",
  REPORT_ARCHIVE = "REPORT_ARCHIVE",
  REPORT_VIEW = "REPORT_VIEW",
  REPORT_EXPORT_PDF = "REPORT_EXPORT_PDF",
  REPORT_VALIDATE = "REPORT_VALIDATE",
  
  // Modules de rapport
  MODULE_CREATE = "MODULE_CREATE",
  MODULE_UPDATE = "MODULE_UPDATE",
  MODULE_DELETE = "MODULE_DELETE",
  
  // Entités
  ENTITY_CREATE = "ENTITY_CREATE",
  ENTITY_UPDATE = "ENTITY_UPDATE",
  ENTITY_DELETE = "ENTITY_DELETE",
  
  // Recherches
  RESEARCH_CREATE = "RESEARCH_CREATE",
  RESEARCH_UPDATE = "RESEARCH_UPDATE",
  RESEARCH_DELETE = "RESEARCH_DELETE",
  
  // Fichiers
  FILE_UPLOAD = "FILE_UPLOAD",
  FILE_DELETE = "FILE_DELETE",
  
  // Corrélations
  CORRELATION_CREATE = "CORRELATION_CREATE",
  CORRELATION_DELETE = "CORRELATION_DELETE",
  
  // Système
  SETTINGS_UPDATE = "SETTINGS_UPDATE",
  SMTP_SETTINGS_UPDATE = "SMTP_SETTINGS_UPDATE",
  AI_SETTINGS_UPDATE = "AI_SETTINGS_UPDATE",
  MAINTENANCE_ENABLE = "MAINTENANCE_ENABLE",
  MAINTENANCE_DISABLE = "MAINTENANCE_DISABLE",
  
  // IA
  AI_GENERATE_TEXT = "AI_GENERATE_TEXT",
  AI_ANALYZE_IMAGE = "AI_ANALYZE_IMAGE",
  
  // Recherche
  SEARCH_EXECUTE = "SEARCH_EXECUTE",
  SEARCH_REINDEX = "SEARCH_REINDEX",
}

/**
 * Ressources pour l'audit
 */
export enum AuditResource {
  AUTH = "auth",
  USER = "user",
  REPORT = "report",
  MODULE = "module",
  ENTITY = "entity",
  RESEARCH = "research",
  FILE = "file",
  CORRELATION = "correlation",
  SETTINGS = "settings",
  AI = "ai",
  SEARCH = "search",
}

interface AuditLogOptions {
  userId?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Service pour gérer les logs d'audit
 */
export class AuditService {
  /**
   * Créer un log d'audit
   */
  static async log(options: AuditLogOptions): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: options.userId || null,
          action: options.action,
          resource: options.resource,
          resourceId: options.resourceId || null,
          details: options.details || undefined,
          ipAddress: options.ipAddress || null,
          userAgent: options.userAgent || null,
        },
      });
    } catch (error) {
      // Ne pas faire échouer la requête si le log échoue
      console.error("Erreur lors de la création du log d'audit:", error);
    }
  }

  /**
   * Créer un log d'audit depuis une requête Express
   */
  static async logFromRequest(
    req: Request,
    action: AuditAction,
    resource: AuditResource,
    resourceId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    const userId = req.user?.id;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get("user-agent");

    await this.log({
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Récupérer les logs d'audit avec filtres et pagination
   */
  static async getLogs(options: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    resource?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }) {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      resource,
      resourceId,
      startDate,
      endDate,
      search,
    } = options;

    const skip = (page - 1) * limit;

    // Construire les conditions de filtre
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (resource) {
      where.resource = resource;
    }

    if (resourceId) {
      where.resourceId = resourceId;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = startDate;
      }
      if (endDate) {
        where.timestamp.lte = endDate;
      }
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { resource: { contains: search, mode: "insensitive" } },
        { resourceId: { contains: search, mode: "insensitive" } },
        { ipAddress: { contains: search, mode: "insensitive" } },
      ];
    }

    // Récupérer les logs et le total
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              matricule: true,
              email: true,
              grade: true,
              unit: true,
            },
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Récupérer les statistiques des logs
   */
  static async getStats(options: {
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    const { startDate, endDate } = options;

    const where: any = {};
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = startDate;
      }
      if (endDate) {
        where.timestamp.lte = endDate;
      }
    }

    const [
      totalLogs,
      actionStats,
      resourceStats,
      userStats,
    ] = await Promise.all([
      // Total de logs
      prisma.auditLog.count({ where }),

      // Statistiques par action
      prisma.auditLog.groupBy({
        by: ["action"],
        where,
        _count: {
          action: true,
        },
        orderBy: {
          _count: {
            action: "desc",
          },
        },
        take: 10,
      }),

      // Statistiques par ressource
      prisma.auditLog.groupBy({
        by: ["resource"],
        where,
        _count: {
          resource: true,
        },
        orderBy: {
          _count: {
            resource: "desc",
          },
        },
      }),

      // Statistiques par utilisateur
      prisma.auditLog.groupBy({
        by: ["userId"],
        where: {
          ...where,
          userId: { not: null },
        },
        _count: {
          userId: true,
        },
        orderBy: {
          _count: {
            userId: "desc",
          },
        },
        take: 10,
      }),
    ]);

    // Récupérer les infos des utilisateurs
    const userIds = userStats
      .map((stat) => stat.userId)
      .filter((id): id is string => id !== null);

    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        matricule: true,
      },
    });

    const userStatsWithDetails = userStats.map((stat) => {
      const user = users.find((u) => u.id === stat.userId);
      return {
        userId: stat.userId,
        count: stat._count.userId,
        user: user || null,
      };
    });

    return {
      totalLogs,
      actionStats: actionStats.map((stat) => ({
        action: stat.action,
        count: stat._count.action,
      })),
      resourceStats: resourceStats.map((stat) => ({
        resource: stat.resource,
        count: stat._count.resource,
      })),
      userStats: userStatsWithDetails,
    };
  }

  /**
   * Supprimer les logs anciens (pour nettoyage automatique)
   */
  static async cleanOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}

/**
 * Middleware pour logger automatiquement les actions
 */
export function auditLog(
  action: AuditAction,
  resource: AuditResource,
  options: {
    getResourceId?: (req: Request) => string | undefined;
    getDetails?: (req: Request) => Record<string, any> | undefined;
  } = {}
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Logger après que la réponse soit envoyée
    res.on("finish", async () => {
      // Ne logger que les succès (2xx et 3xx)
      if (res.statusCode >= 200 && res.statusCode < 400) {
        const resourceId = options.getResourceId
          ? options.getResourceId(req)
          : undefined;
        const details = options.getDetails
          ? options.getDetails(req)
          : undefined;

        await AuditService.logFromRequest(
          req,
          action,
          resource,
          resourceId,
          details
        );
      }
    });

    next();
  };
}
