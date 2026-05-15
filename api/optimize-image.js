import sharp from 'sharp';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // El script de Google envía los bytes directamente en el cuerpo
    const buffer = Buffer.from(req.body);
    
    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ error: 'Empty body' });
    }

    const webpBuffer = await sharp(buffer)
      .resize(1200, null, { withoutEnlargement: true }) // Redimensionar a 1200px max
      .webp({ quality: 80 })
      .toBuffer();

    res.setHeader('Content-Type', 'image/webp');
    return res.status(200).send(webpBuffer);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}