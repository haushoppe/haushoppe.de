// Extrahiert die <article>-Inhalte der einfachen Content-Seiten aus dem Live-HTML,
// lokalisiert URLs (Uploads->/media, interne Links relativ, Mail entschlüsselt), kopiert
// referenzierte Medien und schreibt src/data/live-pages.json = { slug: {title, article} }.
import fs from 'node:fs';
import path from 'node:path';

const BASE = path.resolve(process.env.HOME, 'Work/haushoppe.de-astro-rebuild');
const SITE = path.join(BASE, 'site');
const UP = path.join(BASE, 'wordpress/wp-content/uploads');
const REF = path.join(BASE, 'migration/reference');

const PAGES = [
  { slug: 'vita', file: 'page-vita.html' },
  { slug: 'kontakt', file: 'page-kontakt.html' },
  { slug: 'kunst-erwerben', file: 'page-kunst-erwerben.html' },
  { slug: 'videos', file: 'page-videos.html' },
];

const referenced = new Set();
function rewrite(s) {
  return s
    .replace(/https?:\/\/haushoppe\.de\/wp-content\/uploads\/([^"')\s]+)/g, (_m, p) => { referenced.add(p); return '/media/' + p; })
    .replace(/https?:\/\/haushoppe\.art\//g, '/en/')
    .replace(/https?:\/\/haushoppe\.de\//g, '/')
    .replace(/<mail>([^<]*)<\/mail>/g, (_m, inner) => { const a = inner.replace(/\|/g, ''); return `<a href="mailto:${a}">${a}</a>`; });
}

const out = {};
for (const { slug, file } of PAGES) {
  const p = path.join(REF, file);
  if (!fs.existsSync(p)) { console.warn('fehlt:', file); continue; }
  const html = fs.readFileSync(p, 'utf8');
  const a = html.indexOf('<article');
  const e = html.indexOf('</article>', a);
  if (a === -1 || e === -1) { console.warn('kein <article> in', file); continue; }
  const title = ((html.match(/<title>([^<]*)<\/title>/) || [])[1] || slug).replace(/&#8211;|&ndash;/g, '–').trim();
  out[slug] = { title, article: rewrite(html.slice(a, e + '</article>'.length)) };
  console.log(`${slug}: article ${out[slug].article.length} Zeichen`);
}

fs.mkdirSync(path.join(SITE, 'src/data'), { recursive: true });
fs.writeFileSync(path.join(SITE, 'src/data/live-pages.json'), JSON.stringify(out, null, 2));

let copied = 0, missing = 0;
for (const rel of referenced) {
  const src = path.join(UP, rel);
  const dst = path.join(SITE, 'public/media', rel);
  if (fs.existsSync(src)) { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); copied++; }
  else missing++;
}
console.log(`\nSeiten: ${Object.keys(out).length}. Medien referenziert: ${referenced.size}, kopiert: ${copied}, fehlend: ${missing}.`);
