import sharp from 'sharp';

// Desactivamos el parser automático de Vercel para poder leer el chorro de bytes (binary stream)
export const config = {
  api: {
    bodyParser: false,
  },
};

// Función auxiliar para leer los bytes del cuerpo de la petición
async function getRawBody(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const buffer = await getRawBody(req);
    
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