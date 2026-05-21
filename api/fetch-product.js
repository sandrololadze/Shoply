// api/fetch-product.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'nl-BE,nl;q=0.9,en;q=0.8',
      },
    });

    const html = await response.text();

    // Naam: probeer Open Graph, dan title tag
    let name = '';
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    name = ogTitle?.[1] || titleTag?.[1] || '';
    name = name.replace(/\s*[-|]\s*.+$/, '').trim(); // verwijder "| Bol.com" achtervoegsel

    // Prijs: probeer JSON-LD, dan meta, dan regex
    let price = '';
    const jsonLd = html.match(/"price"\s*:\s*"?([\d.,]+)"?/);
    const ogPrice = html.match(/<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([\d.,]+)["']/i);
    const priceRegex = html.match(/[\u20AC\$\£]\s*([\d.,]+)|(\d+[.,]\d{2})\s*(?:EUR|euro)/i);
    price = jsonLd?.[1] || ogPrice?.[1] || priceRegex?.[1] || priceRegex?.[2] || '';

    // Afbeelding
    let image = '';
    const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    image = ogImage?.[1] || '';

    return res.status(200).json({ name, price, image });
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch product info', detail: err.message });
  }
}