import { Request, Response, NextFunction } from "express";
import { SearchService } from "./search.service";
import { searchSchema } from "./search.validation";
import { logger } from "@/config/logger";

export class SearchController {
  /**
   * Rechercher des rapports
   */
  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const params = searchSchema.parse(req.query);

      // Construire les filtres
      const filters: string[] = [];
      
      if (params.status) {
        filters.push(`status = "${params.status}"`);
      }
      
      if (params.urgencyLevel) {
        filters.push(`urgencyLevel = "${params.urgencyLevel}"`);
      }
      
      if (params.classification) {
        filters.push(`classification = "${params.classification}"`);
      }

      const filterString = filters.length > 0 ? filters.join(" AND ") : undefined;

      // Construire le tri
      const sort = params.sort ? [params.sort] : ["createdAt:desc"];

      const results = await SearchService.search(params.q || "", {
        filter: filterString,
        sort,
        limit: params.limit,
        offset: params.offset,
      });

      return res.status(200).json(results);
    } catch (error) {
      logger.error({ err: error }, "Erreur recherche");
      next(error);
    }
  }

  /**
   * Obtenir les facettes (compteurs)
   */
  static async getFacets(req: Request, res: Response, next: NextFunction) {
    try {
      const { q = "" } = req.query;
      const facetDistribution = await SearchService.getFacets(String(q));

      res.json({ 
        query: String(q),
        facetDistribution 
      });
    } catch (error) {
      logger.error({ err: error }, "Erreur facettes");
      next(error);
    }
  }

  /**
   * Réindexer tous les rapports (admin only)
   */
  static async reindex(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await SearchService.reindexAll();

      res.json({
        success: true,
        message: "Réindexation terminée avec succès",
        indexed: count,
      });
    } catch (error) {
      logger.error({ err: error }, "Erreur réindexation");
      next(error);
    }
  }

  /**
   * Obtenir les statistiques de l'index
   */
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await SearchService.getStats();

      res.json(stats);
    } catch (error) {
      logger.error({ err: error }, "Erreur stats");
      next(error);
    }
  }

  /**
   * Extraire toutes les données des rapports
   */
  static async getExtractedData(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await SearchService.getExtractedData();

      res.json(data);
    } catch (error) {
      logger.error({ err: error }, "Erreur extraction données");
      next(error);
    }
  }
}
