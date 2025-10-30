import nodemailer from "nodemailer";
import createError from "http-errors";
import { prisma } from "@shared/prisma";
import { logger } from "@config/logger";

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export class EmailService {
  /**
   * Récupère la configuration SMTP active depuis la base de données
   */
  private static async getSmtpConfig() {
    const config = await prisma.smtpConfig.findFirst({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });

    if (!config) {
      throw createError(503, "Aucune configuration SMTP active trouvée");
    }

    return config;
  }

  /**
   * Crée un transporteur nodemailer avec la configuration SMTP active
   */
  private static async createTransporter() {
    const config = await this.getSmtpConfig();

    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.username,
        pass: config.password,
      },
    });
  }

  /**
   * Envoie un email en utilisant la configuration SMTP active
   */
  static async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const config = await this.getSmtpConfig();
      const transporter = await this.createTransporter();

      await transporter.sendMail({
        from: config.fromName
          ? `"${config.fromName}" <${config.fromEmail}>`
          : config.fromEmail,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      logger.info({ to: options.to, subject: options.subject }, "Email envoyé avec succès");
    } catch (error) {
      logger.error({ error, to: options.to }, "Échec d'envoi d'email");
      throw createError(500, "Impossible d'envoyer l'email");
    }
  }

  /**
   * Teste la connexion SMTP avec une configuration donnée
   */
  static async testSmtpConnection(config: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
  }): Promise<boolean> {
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.username,
          pass: config.password,
        },
      });

      await transporter.verify();
      logger.info({ host: config.host, port: config.port }, "Test de connexion SMTP réussi");
      return true;
    } catch (error) {
      logger.error({ error, host: config.host }, "Test de connexion SMTP échoué");
      return false;
    }
  }

  /**
   * Envoie un email de test avec une configuration SMTP donnée
   */
  static async sendTestEmail(
    config: {
      host: string;
      port: number;
      secure: boolean;
      username: string;
      password: string;
      fromEmail: string;
      fromName?: string;
    },
    recipientEmail: string
  ): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.username,
        pass: config.password,
      },
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 30px; }
          .success { background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Test de configuration SMTP</h1>
          </div>
          <div class="content">
            <div class="success">
              <strong>Félicitations !</strong>
              <p>Votre configuration SMTP fonctionne correctement.</p>
            </div>
            <p>Cet email de test confirme que votre serveur SMTP est correctement configuré et peut envoyer des emails.</p>
            <p><strong>Détails de la configuration :</strong></p>
            <ul>
              <li>Serveur SMTP : ${config.host}</li>
              <li>Port : ${config.port}</li>
              <li>Sécurisé : ${config.secure ? 'Oui (SSL/TLS)' : 'Non'}</li>
              <li>Utilisateur : ${config.username}</li>
            </ul>
            <p>Vous pouvez maintenant utiliser cette configuration pour envoyer des emails depuis OSINTReport.</p>
          </div>
          <div class="footer">
            <p>Email de test envoyé le ${new Date().toLocaleString('fr-FR')}</p>
            <p>&copy; ${new Date().getFullYear()} OSINTReport. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
✅ Test de configuration SMTP

Félicitations ! Votre configuration SMTP fonctionne correctement.

Cet email de test confirme que votre serveur SMTP est correctement configuré et peut envoyer des emails.

Détails de la configuration :
- Serveur SMTP : ${config.host}
- Port : ${config.port}
- Sécurisé : ${config.secure ? 'Oui (SSL/TLS)' : 'Non'}
- Utilisateur : ${config.username}

Vous pouvez maintenant utiliser cette configuration pour envoyer des emails depuis OSINTReport.

---
Email de test envoyé le ${new Date().toLocaleString('fr-FR')}
© ${new Date().getFullYear()} OSINTReport. Tous droits réservés.
    `;

    await transporter.sendMail({
      from: config.fromName
        ? `"${config.fromName}" <${config.fromEmail}>`
        : config.fromEmail,
      to: recipientEmail,
      subject: "✅ Test de configuration SMTP - OSINTReport",
      text: textContent.trim(),
      html: htmlContent,
    });

    logger.info({ to: recipientEmail, host: config.host }, "Email de test SMTP envoyé avec succès");
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  static async sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetToken: string,
    frontendUrl: string
  ): Promise<void> {
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 30px; }
          .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Réinitialisation de mot de passe</h1>
          </div>
          <div class="content">
            <p>Bonjour ${firstName},</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte OSINTReport.</p>
            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            <p style="text-align: center;">
              <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>
            </p>
            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; color: #2563eb;">${resetLink}</p>
            <p><strong>Ce lien est valide pendant 1 heure.</strong></p>
            <p>Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email. Votre mot de passe restera inchangé.</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            <p>&copy; ${new Date().getFullYear()} OSINTReport. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Bonjour ${firstName},

Vous avez demandé la réinitialisation de votre mot de passe pour votre compte OSINTReport.

Pour créer un nouveau mot de passe, cliquez sur ce lien :
${resetLink}

Ce lien est valide pendant 1 heure.

Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email. Votre mot de passe restera inchangé.

---
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
© ${new Date().getFullYear()} OSINTReport. Tous droits réservés.
    `;

    await this.sendEmail({
      to: email,
      subject: "Réinitialisation de votre mot de passe - OSINTReport",
      text: textContent.trim(),
      html: htmlContent,
    });
  }
}
