/**
 * Script de debug pour vérifier le chemin du logo
 */
import { resolve, join } from "path";
import { existsSync } from "fs";

// Simuler __dirname du fichier compilé
const __dirname = "/workspaces/OSINTReport/backend/dist/modules/pdf";

const logoUrl = "/uploads/logos/logo-1759745175102-892506278.png";

console.log("=== DEBUG LOGO PATH ===");
console.log("__dirname (simulated):", __dirname);
console.log("logoUrl from DB:", logoUrl);

// Retirer le "/" initial
const relativePath = logoUrl.startsWith('/') ? logoUrl.substring(1) : logoUrl;
console.log("relativePath:", relativePath);

// Construire le chemin absolu
const logoPath = resolve(join(__dirname, "../../../", relativePath));
console.log("logoPath (absolute):", logoPath);

// Vérifier l'existence
console.log("File exists?:", existsSync(logoPath));

// URL file://
const fileUrl = `file://${logoPath}`;
console.log("fileUrl for Puppeteer:", fileUrl);

// Test en mode développement (ts-node)
console.log("\n=== MODE DEVELOPMENT (ts-node) ===");
const devDirname = "/workspaces/OSINTReport/backend/src/modules/pdf";
const devLogoPath = resolve(join(devDirname, "../../../", relativePath));
console.log("devDirname:", devDirname);
console.log("devLogoPath:", devLogoPath);
console.log("File exists (dev)?:", existsSync(devLogoPath));
