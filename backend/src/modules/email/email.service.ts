import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { prisma } from '../../config/prisma';
import { logger } from '../../config/logger';

export class EmailService {
  private transporter: Transporter | null = null;

  async getTransporter(): Promise<Transporter | null> {
    try {
      // Récupérer la configuration SMTP active
      const smtpConfig = await prisma.smtpConfig.findFirst({
        where: { active: true },
        orderBy: { createdAt: 'desc' },
      });

      if (!smtpConfig) {
        logger.warn('Aucune configuration SMTP active trouvée');
        return null;
      }

      // Créer le transporter
      this.transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        auth: {
          user: smtpConfig.username,
          pass: smtpConfig.password,
        },
      });

      return this.transporter;
    } catch (error) {
      logger.error('Erreur lors de la création du transporter email', error);
      return null;
    }
  }

  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    userName: string
  ): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      if (!transporter) {
        logger.error('Impossible d\'envoyer l\'email : transporter non disponible');
        return false;
      }

      const smtpConfig = await prisma.smtpConfig.findFirst({
        where: { active: true },
        orderBy: { createdAt: 'desc' },
      });

      if (!smtpConfig) {
        return false;
      }

      // URL de réinitialisation (à adapter selon votre configuration)
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
        to,
        subject: 'Réinitialisation de votre mot de passe - OSINTReport',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .header {
                  background-color: #2563eb;
                  color: white;
                  padding: 20px;
                  text-align: center;
                  border-radius: 5px 5px 0 0;
                }
                .content {
                  background-color: #f9fafb;
                  padding: 30px;
                  border: 1px solid #e5e7eb;
                }
                .button {
                  display: inline-block;
                  background-color: #2563eb;
                  color: white;
                  padding: 12px 30px;
                  text-decoration: none;
                  border-radius: 5px;
                  margin: 20px 0;
                }
                .footer {
                  text-align: center;
                  padding: 20px;
                  font-size: 12px;
                  color: #6b7280;
                }
                .warning {
                  background-color: #fef3c7;
                  border-left: 4px solid #f59e0b;
                  padding: 12px;
                  margin: 20px 0;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>OSINTReport</h1>
                </div>
                <div class="content">
                  <h2>Réinitialisation de mot de passe</h2>
                  <p>Bonjour <strong>${userName}</strong>,</p>
                  <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
                  <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
                  </div>
                  <p>Ou copiez ce lien dans votre navigateur :</p>
                  <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
                  <div class="warning">
                    <strong>⚠️ Attention :</strong> Ce lien est valide pendant 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email et votre mot de passe restera inchangé.
                  </div>
                </div>
                <div class="footer">
                  <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                  <p>&copy; ${new Date().getFullYear()} OSINTReport. Tous droits réservés.</p>
                </div>
              </div>
            </body>
          </html>
        `,
        text: `
Réinitialisation de mot de passe - OSINTReport

Bonjour ${userName},

Vous avez demandé la réinitialisation de votre mot de passe.

Cliquez sur ce lien pour définir un nouveau mot de passe :
${resetUrl}

Ce lien est valide pendant 1 heure.

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email et votre mot de passe restera inchangé.

---
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
© ${new Date().getFullYear()} OSINTReport. Tous droits réservés.
        `,
      };

      await transporter.sendMail(mailOptions);
      logger.info(`Email de réinitialisation envoyé à ${to}`);
      return true;
    } catch (error) {
      logger.error('Erreur lors de l\'envoi de l\'email de réinitialisation', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      if (!transporter) {
        return false;
      }

      await transporter.verify();
      logger.info('Connexion SMTP vérifiée avec succès');
      return true;
    } catch (error) {
      logger.error('Erreur lors de la vérification de la connexion SMTP', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
