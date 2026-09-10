import sharp from 'sharp';

async function test() {
  console.log('Testing sharp...');
  try {
    const svg = '<svg width="200" height="200"><rect width="200" height="200" fill="blue"/></svg>';
    const buf = await sharp(Buffer.from(svg)).png().toBuffer();
    console.log('Buffer length:', buf.length);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
