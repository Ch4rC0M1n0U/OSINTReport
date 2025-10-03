/**
 * Test simple de génération PDF en standalone
 * Pour débugger sans passer par HTTP
 */

import { PDFService } from './src/modules/pdf/pdf.service';
import { logger } from './src/config/logger';

async function testPDFGeneration() {
  const reportId = '6cf38f82-61a8-4534-9441-f20b3e91b4fc';
  
  logger.info({ reportId }, '🧪 Test génération PDF standalone');
  
  try {
    const pdfBuffer = await PDFService.generatePDF({
      reportId,
      includeWatermark: true,
      officerName: 'Test Officer',
      officerRank: 'Inspecteur'
    });
    
    logger.info({ size: pdfBuffer.length }, '✅ PDF généré avec succès!');
    
    // Sauvegarder pour vérification
    const fs = require('fs');
    fs.writeFileSync('test-output.pdf', pdfBuffer);
    logger.info('📄 PDF sauvegardé: test-output.pdf');
    
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, '❌ Erreur génération PDF');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

testPDFGeneration();
