// Script temporaire pour régénérer les URLs des screenshots
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Copie de getPublicBackendUrl()
function getPublicBackendUrl() {
  if (process.env.CODESPACE_NAME) {
    return `https://${process.env.CODESPACE_NAME}-4000.app.github.dev`;
  }
  if (process.env.API_URL) return process.env.API_URL;
  if (process.env.BACKEND_URL) return process.env.BACKEND_URL;
  return 'http://localhost:4000';
}

// Copie de generateSignedUrl()
function generateSignedUrl(filename, expiresAt) {
  const secret = process.env.SIGNED_URL_SECRET || 'DEV_SECRET_KEY_DO_NOT_USE_IN_PRODUCTION';
  
  const timestamp = expiresAt ? new Date(expiresAt).getTime() : Date.now() + 180 * 24 * 60 * 60 * 1000; // 6 mois par défaut
  const data = `${filename}:${timestamp}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
  
  const baseUrl = getPublicBackendUrl();
  return `${baseUrl}/api/media/screenshot/${filename}?signature=${signature}&expires=${timestamp}`;
}

async function regenerateAllUrls() {
  console.log('🔍 Recherche des modules avec attachments...');
  
  const modules = await prisma.reportModule.findMany({
    where: {
      payload: {
        not: prisma.DbNull,
      },
    },
  });
  
  console.log(`📦 ${modules.length} modules trouvés`);
  
  let updateCount = 0;
  const expiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 6 mois
  
  for (const module of modules) {
    if (!module.payload || typeof module.payload !== 'object') continue;
    
    let modified = false;
    const payload = module.payload;
    
    // Vérifier findings[]
    if (Array.isArray(payload.findings)) {
      for (const finding of payload.findings) {
        if (Array.isArray(finding.attachments)) {
          for (let i = 0; i < finding.attachments.length; i++) {
            const attachment = finding.attachments[i];
            
            // attachments peut être soit une string (URL directe), soit un objet { url: '...' }
            const urlString = typeof attachment === 'string' ? attachment : attachment?.url;
            
            if (urlString && urlString.includes('/api/media/screenshot/')) {
              // Extraire le filename
              const urlParts = urlString.split('/');
              const lastPart = urlParts[urlParts.length - 1];
              const filename = lastPart.split('?')[0];
              
              // Régénérer l'URL
              const newUrl = generateSignedUrl(filename, expiresAt);
              
              if (urlString !== newUrl) {
                console.log(`   🔄 Mise à jour: ${filename}`);
                // Remplacer selon le type
                if (typeof attachment === 'string') {
                  finding.attachments[i] = newUrl;
                } else {
                  attachment.url = newUrl;
                }
                modified = true;
              }
            }
          }
        }
      }
    }
    
    // Vérifier entities[]
    if (Array.isArray(payload.entities)) {
      for (const entity of payload.entities) {
        if (Array.isArray(entity.screenshots)) {
          for (const screenshot of entity.screenshots) {
            if (screenshot.url && screenshot.url.includes('/api/media/screenshot/')) {
              const urlParts = screenshot.url.split('/');
              const lastPart = urlParts[urlParts.length - 1];
              const filename = lastPart.split('?')[0];
              
              const newUrl = generateSignedUrl(filename, expiresAt);
              
              if (screenshot.url !== newUrl) {
                console.log(`   🔄 Mise à jour: ${filename}`);
                screenshot.url = newUrl;
                modified = true;
              }
            }
          }
        }
      }
    }
    
    if (modified) {
      await prisma.reportModule.update({
        where: { id: module.id },
        data: { payload },
      });
      updateCount++;
      console.log(`✅ Module ${module.id} mis à jour`);
    }
  }
  
  console.log(`\n✅ Régénération terminée: ${updateCount} modules mis à jour`);
  console.log(`📍 Base URL: ${getPublicBackendUrl()}`);
}

regenerateAllUrls()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
