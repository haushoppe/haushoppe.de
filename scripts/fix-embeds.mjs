// Ersetzt die <ayg-player>-Custom-Elemente (automatic-youtube-gallery) in den extrahierten
// Live-Daten durch eine Datenschutz-Klick-Facade (Poster + Play; erst bei Klick lädt das
// youtube-nocookie-iframe). Die umgebenden ayg-Container bleiben -> Design unverändert.
import fs from 'node:fs';
import path from 'node:path';

const SITE = path.resolve(process.env.HOME, 'Work/haushoppe.de-astro-rebuild/site');
const FILES = ['live-home.json', 'live-home-en.json', 'live-pages.json', 'live-pages-en.json'];

const attr = (s, name) => (s.match(new RegExp(name + '="([^"]*)"')) || [])[1] || '';
const dec = (s) => s.replace(/&#0?38;|&amp;/g, '&');

function facade(tag) {
  const src = dec(attr(tag, 'src'));
  const poster = attr(tag, 'poster');
  const title = attr(tag, 'title').replace(/"/g, '&quot;');
  const ratio = parseFloat(attr(tag, 'ratio')) || 56.25;
  let iframe = src.replace('www.youtube.com/embed', 'www.youtube-nocookie.com/embed');
  iframe += (iframe.includes('?') ? '&' : '?') + 'autoplay=1';
  const aspect = (100 / ratio).toFixed(4);
  return `<div class="yt-facade" data-src="${iframe}" data-title="${title}" style="aspect-ratio:${aspect}">` +
    `<button type="button" class="yt-facade__btn" aria-label="Video abspielen: ${title}">` +
    (poster ? `<img class="yt-facade__poster" src="${poster}" alt="${title}" loading="lazy" decoding="async" />` : '') +
    `<span class="yt-facade__play" aria-hidden="true"></span></button></div>`;
}

function processArticle(html) {
  let n = 0;
  const out = html.replace(/<ayg-player\b([^>]*)>(?:\s*<\/ayg-player>)?/g, (m) => { n++; return facade(m); });
  return { out, n };
}

let total = 0;
for (const f of FILES) {
  const p = path.join(SITE, 'src/data', f);
  if (!fs.existsSync(p)) continue;
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  let count = 0;
  if (data.article) { const r = processArticle(data.article); data.article = r.out; count += r.n; }
  else {
    for (const k of Object.keys(data)) {
      if (data[k] && data[k].article) { const r = processArticle(data[k].article); data[k].article = r.out; count += r.n; }
    }
  }
  if (count) { fs.writeFileSync(p, JSON.stringify(data, null, 2)); console.log(`${f}: ${count} ayg-player -> Facade`); total += count; }
}
console.log(`\nGesamt ${total} Video-Einbettungen zu Facades umgewandelt.`);
