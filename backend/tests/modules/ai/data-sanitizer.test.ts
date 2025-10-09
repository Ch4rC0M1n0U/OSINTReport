/**
 * Tests du service de sanitization des données
 */

import { describe, it, expect } from 'vitest';
import { DataSanitizerService } from '@/modules/ai/data-sanitizer.service';

describe('DataSanitizerService', () => {
  describe('sanitizeText', () => {
    it('devrait anonymiser les noms', () => {
      const text = 'Jean Dupont a rencontré Marie Martin hier.';
      const personalData = {
        names: ['Jean Dupont', 'Marie Martin'],
      };

      const { sanitized, map } = DataSanitizerService.sanitizeText(text, personalData);

      expect(sanitized).toBe('[PERSONNE_1] a rencontré [PERSONNE_2] hier.');
      expect(Object.keys(map).length).toBe(2);
      expect(map['[PERSONNE_1]']).toBe('Jean Dupont');
      expect(map['[PERSONNE_2]']).toBe('Marie Martin');
    });

    it('devrait anonymiser les emails', () => {
      const text = 'Contactez jean.dupont@example.com pour plus d\'infos.';
      const personalData = {
        emails: ['jean.dupont@example.com'],
      };

      const { sanitized, map } = DataSanitizerService.sanitizeText(text, personalData);

      expect(sanitized).toBe('Contactez [EMAIL_1] pour plus d\'infos.');
      expect(map['[EMAIL_1]']).toBe('jean.dupont@example.com');
    });

    it('devrait anonymiser les numéros de téléphone', () => {
      const text = 'Appelez le 06 12 34 56 78.';
      const personalData = {
        phones: ['06 12 34 56 78'],
      };

      const { sanitized, map } = DataSanitizerService.sanitizeText(text, personalData);

      expect(sanitized).toBe('Appelez le [TELEPHONE_1].');
      expect(map['[TELEPHONE_1]']).toBe('06 12 34 56 78');
    });

    it('devrait anonymiser les dates de naissance', () => {
      const text = 'Né(e) le 15/03/1985.';
      const personalData = {
        birthDates: ['15/03/1985'],
      };

      const { sanitized, map } = DataSanitizerService.sanitizeText(text, personalData);

      expect(sanitized).toBe('Né(e) le [DATE_NAISSANCE_1].');
      expect(map['[DATE_NAISSANCE_1]']).toBe('15/03/1985');
    });

    it('devrait anonymiser les adresses', () => {
      const text = 'Domicilié au 123 rue de la Paix, 75001 Paris.';
      const personalData = {
        addresses: ['123 rue de la Paix, 75001 Paris'],
      };

      const { sanitized, map } = DataSanitizerService.sanitizeText(text, personalData);

      expect(sanitized).toBe('Domicilié au [ADRESSE_1].');
      expect(map['[ADRESSE_1]']).toBe('123 rue de la Paix, 75001 Paris');
    });

    it('devrait anonymiser plusieurs types de données', () => {
      const text = 'Jean Dupont (jean@example.com, 06 12 34 56 78) habite à Paris.';
      const personalData = {
        names: ['Jean Dupont'],
        emails: ['jean@example.com'],
        phones: ['06 12 34 56 78'],
        addresses: ['Paris'],
      };

      const { sanitized, map } = DataSanitizerService.sanitizeText(text, personalData);

      expect(sanitized).toContain('[PERSONNE_1]');
      expect(sanitized).toContain('[EMAIL_1]');
      expect(sanitized).toContain('[TELEPHONE_1]');
      expect(sanitized).toContain('[ADRESSE_1]');
      expect(Object.keys(map).length).toBe(4);
    });

    it('devrait gérer les textes vides', () => {
      const { sanitized, map } = DataSanitizerService.sanitizeText('', {});

      expect(sanitized).toBe('');
      expect(Object.keys(map).length).toBe(0);
    });
  });

  describe('desanitizeText', () => {
    it('devrait restaurer les données anonymisées', () => {
      const text = '[PERSONNE_1] a contacté [PERSONNE_2] par [EMAIL_1].';
      const map = {
        '[PERSONNE_1]': 'Jean Dupont',
        '[PERSONNE_2]': 'Marie Martin',
        '[EMAIL_1]': 'marie@example.com',
      };

      const desanitized = DataSanitizerService.desanitizeText(text, map);

      expect(desanitized).toBe('Jean Dupont a contacté Marie Martin par marie@example.com.');
    });

    it('devrait gérer un map vide', () => {
      const text = 'Texte normal';
      const desanitized = DataSanitizerService.desanitizeText(text, {});

      expect(desanitized).toBe('Texte normal');
    });
  });

  describe('sanitizeContext', () => {
    it('devrait anonymiser un objet de contexte', () => {
      const context = {
        reportTitle: 'Enquête sur Jean Dupont',
        existingContent: 'Contact: jean@example.com',
        additionalContext: 'Téléphone: 06 12 34 56 78',
      };

      const personalData = {
        names: ['Jean Dupont'],
        emails: ['jean@example.com'],
        phones: ['06 12 34 56 78'],
      };

      const { sanitized, map } = DataSanitizerService.sanitizeContext(context, personalData);

      expect(sanitized.reportTitle).toBe('Enquête sur [PERSONNE_1]');
      expect(sanitized.existingContent).toBe('Contact: [EMAIL_1]');
      expect(sanitized.additionalContext).toBe('Téléphone: [TELEPHONE_1]');
      expect(Object.keys(map).length).toBe(3);
    });

    it('devrait gérer les objets imbriqués', () => {
      const context = {
        entityData: {
          name: 'Jean Dupont',
          contact: {
            email: 'jean@example.com',
          },
        },
      };

      const personalData = {
        names: ['Jean Dupont'],
        emails: ['jean@example.com'],
      };

      const { sanitized, map } = DataSanitizerService.sanitizeContext(context, personalData);

      expect(sanitized.entityData.name).toBe('[PERSONNE_1]');
      expect(sanitized.entityData.contact.email).toBe('[EMAIL_1]');
      expect(Object.keys(map).length).toBe(2);
    });
  });

  describe('detectEmails', () => {
    it('devrait détecter les emails', () => {
      const text = 'Contactez jean@example.com ou marie.martin@test.fr';
      const emails = DataSanitizerService.detectEmails(text);

      expect(emails).toContain('jean@example.com');
      expect(emails).toContain('marie.martin@test.fr');
      expect(emails.length).toBe(2);
    });

    it('devrait retourner un tableau vide si pas d\'email', () => {
      const text = 'Pas d\'email ici';
      const emails = DataSanitizerService.detectEmails(text);

      expect(emails).toEqual([]);
    });
  });

  describe('detectPhones', () => {
    it('devrait détecter les numéros français', () => {
      const text = 'Appelez 06 12 34 56 78 ou 01.23.45.67.89';
      const phones = DataSanitizerService.detectPhones(text);

      expect(phones.length).toBeGreaterThan(0);
    });
  });

  describe('detectIPs', () => {
    it('devrait détecter les adresses IP', () => {
      const text = 'Connexion depuis 192.168.1.1 et 10.0.0.1';
      const ips = DataSanitizerService.detectIPs(text);

      expect(ips).toContain('192.168.1.1');
      expect(ips).toContain('10.0.0.1');
    });
  });

  describe('autoDetect', () => {
    it('devrait détecter automatiquement les données sensibles', () => {
      const text = 'Contact: jean@example.com, tel: 06 12 34 56 78, IP: 192.168.1.1';
      const detected = DataSanitizerService.autoDetect(text);

      expect(detected.emails?.length).toBe(1);
      expect(detected.phones?.length).toBeGreaterThan(0);
      expect(detected.ipAddresses?.length).toBe(1);
    });
  });

  describe('validateSanitization', () => {
    it('devrait valider un texte correctement anonymisé', () => {
      const text = '[PERSONNE_1] a contacté [EMAIL_1]';
      const personalData = {
        names: ['Jean Dupont'],
        emails: ['jean@example.com'],
      };

      const { isClean, foundData } = DataSanitizerService.validateSanitization(text, personalData);

      expect(isClean).toBe(true);
      expect(foundData.length).toBe(0);
    });

    it('devrait détecter les données non anonymisées', () => {
      const text = 'Jean Dupont a contacté [EMAIL_1]';
      const personalData = {
        names: ['Jean Dupont'],
        emails: ['jean@example.com'],
      };

      const { isClean, foundData } = DataSanitizerService.validateSanitization(text, personalData);

      expect(isClean).toBe(false);
      expect(foundData.length).toBe(1);
      expect(foundData[0]).toContain('Jean Dupont');
    });
  });

  describe('Cycle complet anonymisation/restauration', () => {
    it('devrait anonymiser puis restaurer correctement', () => {
      const originalText = 'Jean Dupont (jean@example.com) habite à Paris.';
      const personalData = {
        names: ['Jean Dupont'],
        emails: ['jean@example.com'],
        addresses: ['Paris'],
      };

      // Anonymiser
      const { sanitized, map } = DataSanitizerService.sanitizeText(originalText, personalData);

      // Vérifier que c'est bien anonymisé
      expect(sanitized).not.toContain('Jean Dupont');
      expect(sanitized).not.toContain('jean@example.com');

      // Restaurer
      const restored = DataSanitizerService.desanitizeText(sanitized, map);

      // Vérifier que c'est bien restauré
      expect(restored).toBe(originalText);
    });
  });
});
