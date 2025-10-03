/**
 * Script de test rapide de l'export PDF
 * Usage: node test-pdf-export.js <reportId> <token>
 */

const http = require('http');
const fs = require('fs');

const reportId = process.argv[2] || '6cf38f82-61a8-4534-9441-f20b3e91b4fc';
const token = process.argv[3];

if (!token) {
  console.error('❌ Usage: node test-pdf-export.js <reportId> <auth-token>');
  console.error('   Récupérez le token depuis les cookies de votre navigateur (auth_token)');
  process.exit(1);
}

const options = {
  hostname: 'localhost',
  port: 4000,
  path: `/api/reports/${reportId}/export/pdf?watermark=true`,
  method: 'GET',
  headers: {
    'Cookie': `auth_token=${token}`
  }
};

console.log(`📄 Test export PDF pour le rapport ${reportId}...`);

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  if (res.statusCode !== 200) {
    let errorData = '';
    res.on('data', (chunk) => {
      errorData += chunk;
    });
    res.on('end', () => {
      console.error('❌ Erreur:', errorData);
    });
    return;
  }

  const filename = `test-export-${Date.now()}.pdf`;
  const writeStream = fs.createWriteStream(filename);
  
  res.pipe(writeStream);
  
  writeStream.on('finish', () => {
    const stats = fs.statSync(filename);
    console.log(`✅ PDF exporté: ${filename} (${(stats.size / 1024).toFixed(2)} KB)`);
  });
});

req.on('error', (e) => {
  console.error(`❌ Erreur requête: ${e.message}`);
});

req.end();
