import sharp from "sharp";

export default async function handler(req, res) {
  try {
    const chunks = [];

    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    const output = await sharp(buffer)
      .resize(1200)
      .webp({ quality: 80 })
      .toBuffer();

    res.setHeader("Content-Type", "image/webp");
    res.send(output);

  } catch (err) {
    res.status(500).send(err.message);
  }
}