// Extrahiert Header/Footer/Body-Klasse (Chrome) + die Home-Article aus dem gespeicherten
// Live-HTML, lokalisiert URLs (Uploads -> /media, interne Links relativ, Mail entschlüsselt)
// und kopiert die referenzierten Upload-Dateien nach public/media. Ziel: exaktes Astra-Design.
import fs from 'node:fs';
import path from 'node:path';

const BASE = path.resolve(process.env.HOME, 'Work/haushoppe.de-astro-rebuild');
const SITE = path.join(BASE, 'site');
const UP = path.join(BASE, 'wordpress/wp-content/uploads');
const html = fs.readFileSync(path.join(BASE, 'migration/reference/home-de.html'), 'utf8');

const between = (s, startMark, endMark, from = 0) => {
  const a = s.indexOf(startMark, from);
  if (a === -1) return null;
  const b = s.indexOf(endMark, a);
  if (b === -1) return null;
  return { html: s.slice(a, b + endMark.length), start: a, end: b + endMark.length };
};

// Header: erstes <header ...> (masthead) bis </header> direkt vor <div id="content"
const hdr = (() => {
  const a = html.indexOf('<header');
  const b = html.indexOf('</header><div id="content"');
  return html.slice(a, b + '</header>'.length);
})();
// Footer: <footer ...colophon...> bis </footer>
const ftr = between(html, '<footer', '</footer>').html;
// Home-Article
const art = between(html, '<article', '</article>').html;
// Body-Klasse
const bodyClass = (html.match(/<body[^>]*class="([^"]*)"/) || [])[1] || '';

// --- URL-/Content-Rewrites ---
const referenced = new Set();
function rewrite(s) {
  return s
    // Uploads -> /media (Pfad merken)
    .replace(/https?:\/\/haushoppe\.de\/wp-content\/uploads\/([^"')\s]+)/g, (_m, p) => { referenced.add(p); return '/media/' + p; })
    // Sprachumschalter -> /en (später echtes EN)
    .replace(/https?:\/\/haushoppe\.art\//g, '/en/')
    // interne Links absolut -> relativ
    .replace(/https?:\/\/haushoppe\.de\//g, '/')
    // mailDecode <mail>t|e|a|m|@...</mail> -> mailto
    .replace(/<mail>([^<]*)<\/mail>/g, (_m, inner) => {
      const addr = inner.replace(/\|/g, '');
      return `<a href="mailto:${addr}">${addr}</a>`;
    });
}

const chrome = { header: rewrite(hdr), footer: rewrite(ftr), bodyClass };
const home = { article: rewrite(art) };

fs.mkdirSync(path.join(SITE, 'src/data'), { recursive: true });
fs.writeFileSync(path.join(SITE, 'src/data/live-chrome.json'), JSON.stringify(chrome, null, 2));
fs.writeFileSync(path.join(SITE, 'src/data/live-home.json'), JSON.stringify(home, null, 2));

// --- referenzierte Medien kopieren ---
let copied = 0, missing = [];
for (const rel of referenced) {
  const src = path.join(UP, rel);
  const dst = path.join(SITE, 'public/media', rel);
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    copied++;
  } else missing.push(rel);
}
console.log(`Chrome+Home extrahiert. Body-Klasse: ${bodyClass.length} Zeichen.`);
console.log(`Referenzierte Medien: ${referenced.size}, kopiert: ${copied}, fehlend: ${missing.length}`);
if (missing.length) console.log('fehlend:', missing.slice(0, 8));
