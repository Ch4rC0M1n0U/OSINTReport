const fs = require('fs');
const exifParser = require('exif-parser');

// Script de test pour diagnostiquer les problèmes EXIF
console.log('🧪 Test EXIF Parser\n');

// Prendre le premier argument comme fichier de test
const testFile = process.argv[2];

if (!testFile) {
  console.error('❌ Usage: node test-exif.js <image-file>');
  console.error('   Example: node test-exif.js ./uploads/screenshots/test.jpg');
  process.exit(1);
}

if (!fs.existsSync(testFile)) {
  console.error(`❌ File not found: ${testFile}`);
  process.exit(1);
}

console.log(`📁 Testing file: ${testFile}\n`);

try {
  const buffer = fs.readFileSync(testFile);
  console.log(`✅ Buffer size: ${buffer.length} bytes\n`);
  
  try {
    console.log('🔍 Creating parser...');
    const parser = exifParser.create(buffer);
    
    console.log('✅ Parser created\n');
    
    console.log('🔍 Parsing EXIF data...');
    const result = parser.parse();
    
    console.log('✅ EXIF parsed successfully\n');
    
    if (result.tags) {
      console.log(`📊 Found ${Object.keys(result.tags).length} EXIF tags:\n`);
      
      // Date
      if (result.tags.DateTimeOriginal) {
        const date = new Date(result.tags.DateTimeOriginal * 1000);
        console.log(`📸 DateTimeOriginal: ${date.toISOString()}`);
      }
      if (result.tags.CreateDate) {
        const date = new Date(result.tags.CreateDate * 1000);
        console.log(`📸 CreateDate: ${date.toISOString()}`);
      }
      
      // GPS
      if (result.tags.GPSLatitude !== undefined) {
        console.log(`📍 GPSLatitude: ${result.tags.GPSLatitude}°`);
      }
      if (result.tags.GPSLongitude !== undefined) {
        console.log(`📍 GPSLongitude: ${result.tags.GPSLongitude}°`);
      }
      if (result.tags.GPSAltitude !== undefined) {
        console.log(`📍 GPSAltitude: ${result.tags.GPSAltitude}m`);
      }
      
      if (!result.tags.GPSLatitude && !result.tags.GPSLongitude) {
        console.log('ℹ️  No GPS data found');
      }
      
      console.log('\n📋 All tags:');
      console.log(JSON.stringify(result.tags, null, 2));
    } else {
      console.log('⚠️  No tags found in result');
    }
    
  } catch (parseErr) {
    console.error('\n❌ Parser error:');
    console.error(parseErr.message);
    console.error(parseErr.stack);
    process.exit(1);
  }
  
} catch (err) {
  console.error('\n❌ File read error:');
  console.error(err.message);
  process.exit(1);
}

console.log('\n✅ Test completed successfully!');
