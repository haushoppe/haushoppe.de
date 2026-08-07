// EN-Zweig (haushoppe.art): Chrome (Header/Footer/Body-Klasse) + Home-Article + Content-Seiten
// aus dem Live-HTML extrahieren, URLs lokalisieren (Uploads beider Domains->/media,
// haushoppe.art->/en, haushoppe.de->/, Mail entschlüsselt) und Medien kopieren.
import fs from 'node:fs';
import path from 'node:path';

const BASE = path.resolve(process.env.HOME, 'Work/haushoppe.de-astro-rebuild');
const SITE = path.join(BASE, 'site');
const UP = path.join(BASE, 'wordpress/wp-content/uploads');
const REF = path.join(BASE, 'migration/reference');

const referenced = new Set();
function rewrite(s) {
  return s
    .replace(/https?:\/\/haushoppe\.(de|art)\/wp-content\/uploads\/([^"')\s]+)/g, (_m, _d, p) => { referenced.add(p); return '/media/' + p; })
    .replace(/https?:\/\/haushoppe\.art\//g, '/en/')
    .replace(/https?:\/\/haushoppe\.de\//g, '/')
    .replace(/<mail>([^<]*)<\/mail>/g, (_m, i) => { const a = i.replace(/\|/g, ''); return `<a href="mailto:${a}">${a}</a>`; });
}
const between = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); return i === -1 || j === -1 ? null : s.slice(i, j + b.length); };

// --- Chrome + Home aus home-en.html ---
const home = fs.readFileSync(path.join(REF, 'home-en.html'), 'utf8');
const header = home.slice(home.indexOf('<header'), home.indexOf('</header><div id="content"') + '</header>'.length);
const footer = between(home, '<footer', '</footer>');
const article = between(home, '<article', '</article>');
const bodyClass = (home.match(/<body[^>]*class="([^"]*)"/) || [])[1] || '';

fs.writeFileSync(path.join(SITE, 'src/data/live-chrome-en.json'), JSON.stringify({ header: rewrite(header), footer: rewrite(footer), bodyClass }, null, 2));
fs.writeFileSync(path.join(SITE, 'src/data/live-home-en.json'), JSON.stringify({ article: rewrite(article) }, null, 2));

// --- Content-Seiten ---
const PAGES = [
  { slug: 'vita', file: 'en-vita.html' },
  { slug: 'contact', file: 'en-contact.html' },
  { slug: 'videos', file: 'en-videos.html' },
  { slug: 'buy-fine-art', file: 'en-buy-fine-art.html' },
];
const pagesOut = {};
for (const { slug, file } of PAGES) {
  const html = fs.readFileSync(path.join(REF, file), 'utf8');
  const art = between(html, '<article', '</article>');
  if (!art) { console.warn('kein <article>:', file); continue; }
  const title = ((html.match(/<title>([^<]*)<\/title>/) || [])[1] || slug).trim();
  pagesOut[slug] = { title, article: rewrite(art) };
  console.log(`en/${slug}: ${pagesOut[slug].article.length} Zeichen`);
}
fs.writeFileSync(path.join(SITE, 'src/data/live-pages-en.json'), JSON.stringify(pagesOut, null, 2));

// --- Medien kopieren ---
let copied = 0, missing = 0;
for (const rel of referenced) {
  const src = path.join(UP, rel), dst = path.join(SITE, 'public/media', rel);
  if (fs.existsSync(src)) { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); copied++; }
  else missing++;
}
console.log(`\nEN-Chrome + Home + ${Object.keys(pagesOut).length} Seiten. Medien: ${referenced.size} ref, ${copied} kopiert, ${missing} fehlend.`);
