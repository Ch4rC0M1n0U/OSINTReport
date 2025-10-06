/**
 * Script de test pour vérifier la génération de PDF avec logo
 */
import { prisma } from "./src/config/prisma";
import { PDFService } from "./src/modules/pdf/pdf.service";
import { writeFile } from "fs/promises";

async function testPDFGeneration() {
  try {
    console.log("🔍 Recherche d'un rapport...");
    
    // Trouver le premier rapport
    const report = await prisma.report.findFirst({
      select: { id: true, title: true },
    });

    if (!report) {
      console.log("❌ Aucun rapport trouvé dans la base de données");
      return;
    }

    console.log(`✅ Rapport trouvé: ${report.title} (ID: ${report.id})`);
    console.log("\n📄 Génération du PDF...");

    // Générer le PDF
    const pdfBuffer = await PDFService.generatePDF({
      reportId: report.id,
      includeWatermark: false,
      officerName: "Test Officer",
      officerRank: "Test Rank",
    });

    // Sauvegarder le PDF
    const outputPath = "./test-logo-output.pdf";
    await writeFile(outputPath, pdfBuffer);

    console.log(`\n✅ PDF généré avec succès: ${outputPath}`);
    console.log(`📊 Taille: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error("\n❌ Erreur lors de la génération:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

testPDFGeneration();
