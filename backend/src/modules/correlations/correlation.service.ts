import { prisma } from '@/config/prisma';
import {
  CorrelationType,
  CorrelationMatch,
  CreateCorrelationDto,
  CorrelationData,
} from './correlation.types';
import { logger } from '@/config/logger';

/**
 * Service de détection et gestion des corrélations entre rapports
 */
export class CorrelationService {
  /**
   * Extrait les données potentiellement corrélables d'un rapport
   */
  private async extractCorrelatableData(reportId: string): Promise<
    Array<{
      type: CorrelationType;
      value: string;
      context: string;
    }>
  > {
    const correlatableData: Array<{
      type: CorrelationType;
      value: string;
      context: string;
    }> = [];

    // Récupérer le rapport avec ses modules, entités et recherches
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        modules: {
          include: {
            entity: true,
            researchItems: true,
          },
        },
      },
    });

    if (!report) {
      return correlatableData;
    }

    // Extraire les données des entités et research records
    for (const module of report.modules) {
      const contextLabel = `Module: ${module.title || 'Sans titre'}`;
      
      // Extraire depuis les "Entités identifiées" (findings) - POUR TOUS LES MODULES
      if (module.payload && typeof module.payload === 'object') {
        const payload: any = module.payload;
        
        if (payload.findings && Array.isArray(payload.findings)) {
          for (const finding of payload.findings) {
            // Le label du finding est toujours présent (nom de la personne/org)
            const label = finding.label?.trim();
            
            if (!label) continue;
            
            if (finding.metadata) {
              const meta = finding.metadata;
              
              // Noms de personnes - utiliser directement le label
              if (meta.entityType === 'person') {
                correlatableData.push({
                  type: CorrelationType.NAME,
                  value: label,
                  context: `Entité identifiée: ${label}`,
                });
              }
              
              // Organisations - utiliser le label ou legalName
              if (meta.entityType === 'organization' || meta.entityType === 'company') {
                const orgName = meta.companyDetails?.legalName || label;
                correlatableData.push({
                  type: CorrelationType.ORGANIZATION,
                  value: orgName,
                  context: `Entité identifiée: ${label}`,
                });
              }
              
              // Téléphones depuis personDetails (si c'est un tableau)
              if (meta.personDetails?.phoneNumbers && Array.isArray(meta.personDetails.phoneNumbers)) {
                for (const phone of meta.personDetails.phoneNumbers) {
                  const phoneNumber = typeof phone === 'string' ? phone : phone.number;
                  if (phoneNumber) {
                    correlatableData.push({
                      type: CorrelationType.PHONE,
                      value: String(phoneNumber),
                      context: `Entité identifiée: ${label}`,
                    });
                  }
                }
              }
              
              // Téléphones depuis companyDetails (si c'est un tableau)
              if (meta.companyDetails?.phoneNumbers && Array.isArray(meta.companyDetails.phoneNumbers)) {
                for (const phone of meta.companyDetails.phoneNumbers) {
                  const phoneNumber = typeof phone === 'string' ? phone : phone.number;
                  if (phoneNumber) {
                    correlatableData.push({
                      type: CorrelationType.PHONE,
                      value: String(phoneNumber),
                      context: `Entité identifiée: ${label}`,
                    });
                  }
                }
              }
              
              // Emails depuis personDetails (si c'est un tableau)
              if (meta.personDetails?.emails && Array.isArray(meta.personDetails.emails)) {
                for (const email of meta.personDetails.emails) {
                  const emailAddress = typeof email === 'string' ? email : email.address;
                  if (emailAddress) {
                    correlatableData.push({
                      type: CorrelationType.EMAIL,
                      value: String(emailAddress),
                      context: `Entité identifiée: ${label}`,
                    });
                  }
                }
              }
              
              // Emails depuis companyDetails (si c'est un tableau)
              if (meta.companyDetails?.emails && Array.isArray(meta.companyDetails.emails)) {
                for (const email of meta.companyDetails.emails) {
                  const emailAddress = typeof email === 'string' ? email : email.address;
                  if (emailAddress) {
                    correlatableData.push({
                      type: CorrelationType.EMAIL,
                      value: String(emailAddress),
                      context: `Entité identifiée: ${label}`,
                    });
                  }
                }
              }
              
              // Adresses depuis personDetails
              if (meta.personDetails?.addresses && Array.isArray(meta.personDetails.addresses)) {
                for (const addr of meta.personDetails.addresses) {
                  const fullAddress = typeof addr === 'string' ? addr : addr.fullAddress;
                  if (fullAddress) {
                    correlatableData.push({
                      type: CorrelationType.ADDRESS,
                      value: String(fullAddress),
                      context: `Entité identifiée: ${label}`,
                    });
                  }
                }
              }
              
              // Adresse physique unique (ancienne structure)
              if (meta.personDetails?.physicalAddress && typeof meta.personDetails.physicalAddress === 'string') {
                correlatableData.push({
                  type: CorrelationType.ADDRESS,
                  value: meta.personDetails.physicalAddress,
                  context: `Entité identifiée: ${label}`,
                });
              }
              
              // Adresses depuis companyDetails
              if (meta.companyDetails?.addresses && Array.isArray(meta.companyDetails.addresses)) {
                for (const addr of meta.companyDetails.addresses) {
                  const fullAddress = typeof addr === 'string' ? addr : addr.fullAddress;
                  if (fullAddress) {
                    correlatableData.push({
                      type: CorrelationType.ADDRESS,
                      value: String(fullAddress),
                      context: `Entité identifiée: ${label}`,
                    });
                  }
                }
              }
            } else {
              // Pas de metadata - utiliser juste le label comme nom
              correlatableData.push({
                type: CorrelationType.NAME,
                value: label,
                context: `Entité identifiée: ${label}`,
              });
            }
          }
        }
      }
      
      // Données de l'entité (si le module a une entité associée)
      if (module.entity) {
        const entityType = module.entity.type;

        // Les entités stockent juste le type, les vraies données sont dans payload ou researchItems
        // On va chercher dans le payload du module
        if (module.payload && typeof module.payload === 'object') {
          const payload: any = module.payload;

          // Téléphones
          if (payload.phoneNumber || payload.phone || payload.telephone) {
            const phone =
              payload.phoneNumber || payload.phone || payload.telephone;
            correlatableData.push({
              type: CorrelationType.PHONE,
              value: String(phone),
              context: contextLabel,
            });
          }

          // Emails
          if (payload.email) {
            correlatableData.push({
              type: CorrelationType.EMAIL,
              value: String(payload.email),
              context: contextLabel,
            });
          }

          // Adresses
          if (payload.address || payload.adresse) {
            correlatableData.push({
              type: CorrelationType.ADDRESS,
              value: String(payload.address || payload.adresse),
              context: contextLabel,
            });
          }

          // Comptes utilisateur
          if (payload.username || payload.accountUsername) {
            correlatableData.push({
              type: CorrelationType.ACCOUNT,
              value: String(payload.username || payload.accountUsername),
              context: contextLabel,
            });
          }

          // Organisations
          if (
            entityType === 'ORGANIZATION' &&
            (payload.name || payload.organizationName)
          ) {
            correlatableData.push({
              type: CorrelationType.ORGANIZATION,
              value: String(payload.name || payload.organizationName),
              context: contextLabel,
            });
          }

          // Noms de personnes
          if (
            entityType === 'PERSON' &&
            (payload.firstName || payload.lastName)
          ) {
            const fullName = `${payload.firstName || ''} ${payload.lastName || ''}`.trim();
            if (fullName) {
              correlatableData.push({
                type: CorrelationType.NAME,
                value: fullName,
                context: contextLabel,
              });
            }
          }
        }
      }

      // Extraire aussi des research records
      for (const record of module.researchItems) {
        if (record.details && typeof record.details === 'object') {
          const details: any = record.details;

          // Parcourir les clés pour trouver des données corrélables
          if (details.phoneNumber || details.phone) {
            correlatableData.push({
              type: CorrelationType.PHONE,
              value: String(details.phoneNumber || details.phone),
              context: `Recherche: ${record.subtitle || 'Sans titre'}`,
            });
          }

          if (details.email) {
            correlatableData.push({
              type: CorrelationType.EMAIL,
              value: String(details.email),
              context: `Recherche: ${record.subtitle || 'Sans titre'}`,
            });
          }

          if (details.address) {
            correlatableData.push({
              type: CorrelationType.ADDRESS,
              value: String(details.address),
              context: `Recherche: ${record.subtitle || 'Sans titre'}`,
            });
          }
        }
      }
    }

    return correlatableData;
  }

  /**
   * Recherche des corrélations pour une valeur spécifique
   */
  async checkCorrelation(
    reportId: string,
    value: string,
    type: CorrelationType
  ): Promise<CorrelationMatch[]> {
    const matches: CorrelationMatch[] = [];

    // Rechercher dans les corrélations existantes
    const existingCorrelations = await prisma.reportCorrelation.findMany({
      where: {
        OR: [{ sourceReportId: reportId }, { relatedReportId: reportId }],
        correlationType: type,
        correlationData: {
          path: ['value'],
          equals: value,
        },
      },
      include: {
        sourceReport: true,
        relatedReport: true,
      },
    });

    for (const correlation of existingCorrelations) {
      const relatedReport =
        correlation.sourceReportId === reportId
          ? correlation.relatedReport
          : correlation.sourceReport;

      matches.push({
        reportId: relatedReport.id,
        reportTitle: relatedReport.title,
        reportNumber: relatedReport.reportNumber || undefined,
        caseNumber: relatedReport.caseNumber || undefined,
        correlationType: type,
        correlationData: correlation.correlationData as unknown as CorrelationData,
        confidence: correlation.confidence,
        createdAt: correlation.detectedAt,
      });
    }

    // Rechercher dans les payloads d'autres rapports
    const reports = await prisma.report.findMany({
      where: {
        id: { not: reportId },
        status: { not: 'ARCHIVED' },
      },
      include: {
        modules: {
          include: {
            entity: true,
            researchItems: true,
          },
        },
      },
    });

    for (const report of reports) {
      for (const module of report.modules) {
        let found = false;
        let confidence = 1.0;
        let foundContext = '';

        // Chercher dans le payload du module
        if (module.payload && typeof module.payload === 'object') {
          const payload: any = module.payload;

          switch (type) {
            case CorrelationType.PHONE:
              if (
                payload.phoneNumber === value ||
                payload.phone === value ||
                payload.telephone === value
              ) {
                found = true;
                foundContext = `Module: ${module.title}`;
              }
              break;

            case CorrelationType.EMAIL:
              if (payload.email === value) {
                found = true;
                foundContext = `Module: ${module.title}`;
              }
              break;

            case CorrelationType.ADDRESS:
              if (payload.address === value || payload.adresse === value) {
                found = true;
                foundContext = `Module: ${module.title}`;
              }
              break;

            case CorrelationType.ACCOUNT:
              if (
                payload.username === value ||
                payload.accountUsername === value
              ) {
                found = true;
                foundContext = `Module: ${module.title}`;
              }
              break;

            case CorrelationType.ORGANIZATION:
              if (
                module.entity?.type === 'ORGANIZATION' &&
                (payload.name === value || payload.organizationName === value)
              ) {
                found = true;
                foundContext = `Module: ${module.title}`;
              }
              break;

            case CorrelationType.NAME:
              if (module.entity?.type === 'PERSON') {
                const fullName = `${payload.firstName || ''} ${payload.lastName || ''}`.trim();
                if (fullName === value) {
                  found = true;
                  foundContext = `Module: ${module.title}`;
                } else if (
                  fullName &&
                  fullName.toLowerCase().includes(value.toLowerCase())
                ) {
                  found = true;
                  confidence = 0.7; // Correspondance partielle
                  foundContext = `Module: ${module.title}`;
                }
              }
              break;
          }
        }

        // Chercher aussi dans les "Entités identifiées" (findings)
        if (!found && module.payload && typeof module.payload === 'object') {
          const payload: any = module.payload;
          
          if (payload.findings && Array.isArray(payload.findings)) {
            for (const finding of payload.findings) {
              const label = finding.label?.trim();
              
              if (!label) continue;
              
              if (finding.metadata) {
                const meta = finding.metadata;
                
                switch (type) {
                  case CorrelationType.NAME:
                    if (meta.entityType === 'person') {
                      // Comparaison exacte
                      if (label === value) {
                        found = true;
                        foundContext = `Entité identifiée: ${label}`;
                      } 
                      // Comparaison partielle (insensible à la casse)
                      else if (label.toLowerCase().includes(value.toLowerCase()) || 
                               value.toLowerCase().includes(label.toLowerCase())) {
                        found = true;
                        confidence = 0.7;
                        foundContext = `Entité identifiée: ${label}`;
                      }
                    }
                    break;

                  case CorrelationType.ORGANIZATION:
                    if (meta.entityType === 'organization' || meta.entityType === 'company') {
                      const orgName = meta.companyDetails?.legalName || label;
                      if (orgName === value) {
                        found = true;
                        foundContext = `Entité identifiée: ${label}`;
                      }
                    }
                    break;

                  case CorrelationType.PHONE:
                    // Chercher dans les téléphones de personDetails
                    if (meta.personDetails?.phoneNumbers && Array.isArray(meta.personDetails.phoneNumbers)) {
                      for (const phone of meta.personDetails.phoneNumbers) {
                        const phoneNumber = typeof phone === 'string' ? phone : phone.number;
                        if (phoneNumber === value) {
                          found = true;
                          foundContext = `Entité identifiée: ${label}`;
                          break;
                        }
                      }
                    }
                    // Chercher dans les téléphones de companyDetails
                    if (!found && meta.companyDetails?.phoneNumbers && Array.isArray(meta.companyDetails.phoneNumbers)) {
                      for (const phone of meta.companyDetails.phoneNumbers) {
                        const phoneNumber = typeof phone === 'string' ? phone : phone.number;
                        if (phoneNumber === value) {
                          found = true;
                          foundContext = `Entité identifiée: ${label}`;
                          break;
                        }
                      }
                    }
                    break;

                  case CorrelationType.EMAIL:
                    // Chercher dans les emails de personDetails
                    if (meta.personDetails?.emails && Array.isArray(meta.personDetails.emails)) {
                      for (const email of meta.personDetails.emails) {
                        const emailAddress = typeof email === 'string' ? email : email.address;
                        if (emailAddress === value) {
                          found = true;
                          foundContext = `Entité identifiée: ${label}`;
                          break;
                        }
                      }
                    }
                    // Chercher dans les emails de companyDetails
                    if (!found && meta.companyDetails?.emails && Array.isArray(meta.companyDetails.emails)) {
                      for (const email of meta.companyDetails.emails) {
                        const emailAddress = typeof email === 'string' ? email : email.address;
                        if (emailAddress === value) {
                          found = true;
                          foundContext = `Entité identifiée: ${label}`;
                          break;
                        }
                      }
                    }
                    break;

                  case CorrelationType.ADDRESS:
                    // Chercher dans les adresses de personDetails (tableau)
                    if (meta.personDetails?.addresses && Array.isArray(meta.personDetails.addresses)) {
                      for (const addr of meta.personDetails.addresses) {
                        const fullAddress = typeof addr === 'string' ? addr : addr.fullAddress;
                        if (fullAddress === value) {
                          found = true;
                          foundContext = `Entité identifiée: ${label}`;
                          break;
                        }
                      }
                    }
                    // Chercher dans physicalAddress (ancienne structure)
                    if (!found && meta.personDetails?.physicalAddress === value) {
                      found = true;
                      foundContext = `Entité identifiée: ${label}`;
                    }
                    // Chercher dans les adresses de companyDetails
                    if (!found && meta.companyDetails?.addresses && Array.isArray(meta.companyDetails.addresses)) {
                      for (const addr of meta.companyDetails.addresses) {
                        const fullAddress = typeof addr === 'string' ? addr : addr.fullAddress;
                        if (fullAddress === value) {
                          found = true;
                          foundContext = `Entité identifiée: ${label}`;
                          break;
                        }
                      }
                    }
                    break;
                }
              } else {
                // Pas de metadata - utiliser juste le label comme nom
                if (type === CorrelationType.NAME) {
                  if (label === value) {
                    found = true;
                    foundContext = `Entité identifiée: ${label}`;
                  } else if (label.toLowerCase().includes(value.toLowerCase()) || 
                            value.toLowerCase().includes(label.toLowerCase())) {
                    found = true;
                    confidence = 0.7;
                    foundContext = `Entité identifiée: ${label}`;
                  }
                }
              }
              
              if (found) break;
            }
          }
        }

        // Chercher aussi dans les research records
        if (!found) {
          for (const record of module.researchItems) {
            if (record.details && typeof record.details === 'object') {
              const details: any = record.details;

              switch (type) {
                case CorrelationType.PHONE:
                  if (details.phoneNumber === value || details.phone === value) {
                    found = true;
                    foundContext = `Recherche: ${record.subtitle}`;
                  }
                  break;

                case CorrelationType.EMAIL:
                  if (details.email === value) {
                    found = true;
                    foundContext = `Recherche: ${record.subtitle}`;
                  }
                  break;

                case CorrelationType.ADDRESS:
                  if (details.address === value) {
                    found = true;
                    foundContext = `Recherche: ${record.subtitle}`;
                  }
                  break;
              }
            }

            if (found) break;
          }
        }

        if (found) {
          // Vérifier si cette corrélation existe déjà
          const alreadyExists = matches.some(
            (m) => m.reportId === report.id && m.correlationType === type
          );

          if (!alreadyExists) {
            matches.push({
              reportId: report.id,
              reportTitle: report.title,
              reportNumber: report.reportNumber || undefined,
              caseNumber: report.caseNumber || undefined,
              correlationType: type,
              correlationData: {
                value,
                context: foundContext,
                extractedFrom: 'module.payload',
              },
              confidence,
              createdAt: report.createdAt,
            });
          }
        }
      }
    }

    return matches;
  }

  /**
   * Détecte automatiquement toutes les corrélations pour un rapport
   */
  async detectCorrelations(reportId: string): Promise<void> {
    logger.info(`Détection des corrélations pour le rapport ${reportId}`);

    const correlatableData = await this.extractCorrelatableData(reportId);

    for (const data of correlatableData) {
      const matches = await this.checkCorrelation(
        reportId,
        data.value,
        data.type
      );

      // Créer les corrélations trouvées
      for (const match of matches) {
        await this.createCorrelation({
          sourceReportId: reportId,
          relatedReportId: match.reportId,
          correlationType: data.type,
          correlationData: {
            value: data.value,
            context: data.context,
          },
          confidence: match.confidence,
        });
      }
    }

    logger.info(
      `Détection terminée: ${correlatableData.length} éléments analysés`
    );
  }

  /**
   * Crée une nouvelle corrélation
   */
  async createCorrelation(dto: CreateCorrelationDto): Promise<void> {
    try {
      // Vérifier si la corrélation existe déjà
      const existing = await prisma.reportCorrelation.findFirst({
        where: {
          sourceReportId: dto.sourceReportId,
          relatedReportId: dto.relatedReportId,
          correlationType: dto.correlationType,
        },
      });

      if (existing) {
        // Mettre à jour si la confiance est plus élevée
        if (dto.confidence > existing.confidence) {
          await prisma.reportCorrelation.update({
            where: { id: existing.id },
            data: {
              confidence: dto.confidence,
              correlationData: dto.correlationData as any,
              notes: dto.notes,
            },
          });
        }
        return;
      }

      // Créer la nouvelle corrélation
      await prisma.reportCorrelation.create({
        data: {
          sourceReportId: dto.sourceReportId,
          relatedReportId: dto.relatedReportId,
          correlationType: dto.correlationType,
          correlationData: dto.correlationData as any,
          confidence: dto.confidence,
          notes: dto.notes,
        },
      });
    } catch (error) {
      logger.error(
        { error },
        'Erreur lors de la création de corrélation'
      );
    }
  }

  /**
   * Récupère toutes les corrélations pour un rapport
   */
  async getReportCorrelations(
    reportId: string,
    options?: {
      type?: CorrelationType;
      minConfidence?: number;
      verified?: boolean;
    }
  ) {
    const where: any = {
      OR: [{ sourceReportId: reportId }, { relatedReportId: reportId }],
    };

    if (options?.type) {
      where.correlationType = options.type;
    }

    if (options?.minConfidence !== undefined) {
      where.confidence = { gte: options.minConfidence };
    }

    if (options?.verified !== undefined) {
      if (options.verified) {
        where.verifiedAt = { not: null };
      } else {
        where.verifiedAt = null;
      }
    }

    return prisma.reportCorrelation.findMany({
      where,
      include: {
        sourceReport: {
          select: {
            id: true,
            title: true,
            reportNumber: true,
            caseNumber: true,
          },
        },
        relatedReport: {
          select: {
            id: true,
            title: true,
            reportNumber: true,
            caseNumber: true,
          },
        },
      },
      orderBy: [{ confidence: 'desc' }, { detectedAt: 'desc' }],
    });
  }

  /**
   * Vérifie une corrélation (marquée comme validée par un enquêteur)
   */
  async verifyCorrelation(
    correlationId: string,
    userId: string,
    notes?: string
  ) {
    return prisma.reportCorrelation.update({
      where: { id: correlationId },
      data: {
        verifiedBy: userId,
        verifiedAt: new Date(),
        notes: notes || undefined,
      },
    });
  }

  /**
   * Supprime une corrélation
   */
  async deleteCorrelation(correlationId: string) {
    return prisma.reportCorrelation.delete({
      where: { id: correlationId },
    });
  }
}

export const correlationService = new CorrelationService();
