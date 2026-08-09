import type { APIRoute } from 'astro';

// robots.txt pro Domain: erlaubt alles und verweist auf die (von @astrojs/sitemap erzeugte)
// Sitemap unter der jeweils richtigen Domain (haushoppe.de bzw. haushoppe.art). So finden
// Crawler alle Werk-Detailseiten, obwohl die Galerie sie per Infinite Scroll nachlädt.
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', site).href;
  const body = `User-agent: *
Allow: /

Sitemap: ${sitemap}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
