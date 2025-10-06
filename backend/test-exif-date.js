const exifr = require('exifr');

async function testExifDate() {
  const files = require('fs').readdirSync('uploads/screenshots')
    .filter(f => f.endsWith('.webp'));
  
  if (files.length === 0) {
    console.log('No images found');
    return;
  }
  
  const imagePath = `uploads/screenshots/${files[files.length - 1]}`;
  console.log('Testing:', imagePath);
  
  const exif = await exifr.parse(imagePath, {
    pick: ['DateTimeOriginal', 'CreateDate', 'DateTime', 'OffsetTime', 'OffsetTimeOriginal'],
    translateValues: false, // On veut les valeurs brutes!
  });
  
  console.log('\n📅 Raw EXIF data:');
  console.log(exif);
  
  console.log('\n🕐 Date parsing:');
  if (exif?.DateTimeOriginal) {
    console.log('DateTimeOriginal (raw):', exif.DateTimeOriginal);
    console.log('DateTimeOriginal (Date):', new Date(exif.DateTimeOriginal));
    console.log('DateTimeOriginal (ISO):', new Date(exif.DateTimeOriginal).toISOString());
  }
}

testExifDate().catch(console.error);
