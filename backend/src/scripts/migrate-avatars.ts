import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const prisma = new PrismaClient();

async function migrateAvatars() {
  console.log("🚀 Début de la migration des avatars...\n");

  // Use absolute path from project root
  const avatarDir = path.join(process.cwd(), "../frontend/public/images/avatars");
  console.log(`📁 Dossier de destination: ${avatarDir}\n`);
  await fs.mkdir(avatarDir, { recursive: true });

  const users = await prisma.user.findMany({
    where: {
      avatarUrl: {
        not: null,
      },
    },
    select: {
      id: true,
      email: true,
      avatarUrl: true,
    },
  });

  console.log(`📊 ${users.length} utilisateurs trouvés avec avatar\n`);

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const user of users) {
    if (!user.avatarUrl) continue;

    try {
      // Skip if already a file path
      if (user.avatarUrl.startsWith("/images/avatars/")) {
        console.log(`⏭️  ${user.email}: Déjà un fichier (${user.avatarUrl})`);
        skippedCount++;
        continue;
      }

      // Skip if external URL
      if (user.avatarUrl.startsWith("http://") || user.avatarUrl.startsWith("https://")) {
        console.log(`⏭️  ${user.email}: URL externe (${user.avatarUrl.substring(0, 50)}...)`);
        skippedCount++;
        continue;
      }

      // Process base64 data URI
      if (user.avatarUrl.startsWith("data:image/")) {
        const matches = user.avatarUrl.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
          console.log(`❌ ${user.email}: Format base64 invalide`);
          errorCount++;
          continue;
        }

        const [, extension, base64Data] = matches;
        const buffer = Buffer.from(base64Data, "base64");

        // Generate unique filename
        const filename = `${user.id}-${crypto.randomBytes(8).toString("hex")}.${extension}`;
        const filePath = path.join(avatarDir, filename);
        const newAvatarUrl = `/images/avatars/${filename}`;

        // Save file
        await fs.writeFile(filePath, buffer);

        // Update database
        await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: newAvatarUrl },
        });

        const sizeKB = (buffer.length / 1024).toFixed(2);
        console.log(`✅ ${user.email}: Migré (${sizeKB} KB) → ${filename}`);
        migratedCount++;
      } else {
        console.log(`⚠️  ${user.email}: Format non reconnu (${user.avatarUrl.substring(0, 50)}...)`);
        errorCount++;
      }
    } catch (error) {
      console.error(`❌ ${user.email}: Erreur -`, error instanceof Error ? error.message : error);
      errorCount++;
    }
  }

  console.log("\n📊 Résumé de la migration:");
  console.log(`   ✅ Migrés: ${migratedCount}`);
  console.log(`   ⏭️  Ignorés: ${skippedCount}`);
  console.log(`   ❌ Erreurs: ${errorCount}`);
  console.log(`   📁 Total: ${users.length}`);

  await prisma.$disconnect();
}

migrateAvatars().catch((error) => {
  console.error("💥 Erreur fatale:", error);
  process.exit(1);
});
