/**
 * Service pour envoyer des notifications via Microsoft Teams
 * Utilise les webhooks Teams (pas besoin d'accès Azure Console)
 */

import { logger } from "@/config/logger";
import { SettingsService } from "@modules/settings/settings.service";

export interface TeamsNotification {
  title: string;
  message: string;
  severity?: "info" | "warning" | "error" | "success";
  facts?: Array<{ name: string; value: string }>;
}

export class TeamsNotificationService {
  /**
   * Envoyer une notification à Microsoft Teams
   * @param notification Objet de notification
   * @returns true si envoyé avec succès, false sinon
   */
  static async send(notification: TeamsNotification): Promise<boolean> {
    try {
      // Vérifier si les notifications Teams sont activées
      const settings = await SettingsService.getSettings();
      
      if (!settings.teamsNotificationsEnabled || !settings.teamsWebhookUrl) {
        logger.debug("Notifications Teams désactivées ou webhook non configuré");
        return false;
      }

      // Définir la couleur selon la sévérité
      const colorMap = {
        info: "0078D4", // Bleu
        warning: "FFA500", // Orange
        error: "DC3545", // Rouge
        success: "28A745", // Vert
      };

      const themeColor = colorMap[notification.severity || "info"];

      // Construire le message au format MessageCard
      // Documentation: https://docs.microsoft.com/en-us/outlook/actionable-messages/message-card-reference
      const messageCard = {
        "@type": "MessageCard",
        "@context": "https://schema.org/extensions",
        summary: notification.title,
        themeColor: themeColor,
        title: notification.title,
        text: notification.message,
        sections: notification.facts
          ? [
              {
                facts: notification.facts,
              },
            ]
          : undefined,
      };

      // Envoyer la requête au webhook Teams
      const response = await fetch(settings.teamsWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageCard),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(
          { status: response.status, error: errorText },
          "Erreur lors de l'envoi de la notification Teams"
        );
        return false;
      }

      logger.info({ title: notification.title }, "Notification Teams envoyée avec succès");
      return true;
    } catch (error) {
      logger.error({ error }, "Erreur lors de l'envoi de la notification Teams");
      return false;
    }
  }

  /**
   * Envoyer une alerte critique
   */
  static async sendCriticalAlert(title: string, message: string, details?: Record<string, string>): Promise<boolean> {
    const facts = details
      ? Object.entries(details).map(([name, value]) => ({ name, value }))
      : undefined;

    return this.send({
      title: `🚨 ALERTE CRITIQUE: ${title}`,
      message,
      severity: "error",
      facts,
    });
  }

  /**
   * Envoyer une notification d'information
   */
  static async sendInfo(title: string, message: string, details?: Record<string, string>): Promise<boolean> {
    const facts = details
      ? Object.entries(details).map(([name, value]) => ({ name, value }))
      : undefined;

    return this.send({
      title: `ℹ️ ${title}`,
      message,
      severity: "info",
      facts,
    });
  }

  /**
   * Tester le webhook Teams
   */
  static async testWebhook(webhookUrl: string): Promise<boolean> {
    try {
      const testMessage = {
        "@type": "MessageCard",
        "@context": "https://schema.org/extensions",
        summary: "Test de connexion",
        themeColor: "0078D4",
        title: "🔔 Test de connexion",
        text: "Si vous voyez ce message, votre webhook Microsoft Teams est correctement configuré !",
        sections: [
          {
            facts: [
              { name: "Application", value: "OSINT Report" },
              { name: "Date", value: new Date().toLocaleString("fr-BE") },
            ],
          },
        ],
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testMessage),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(
          { status: response.status, error: errorText },
          "Échec du test du webhook Teams"
        );
        return false;
      }

      logger.info("Test du webhook Teams réussi");
      return true;
    } catch (error) {
      logger.error({ error }, "Erreur lors du test du webhook Teams");
      return false;
    }
  }
}
