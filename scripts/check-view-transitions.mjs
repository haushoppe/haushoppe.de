// GETEILT mit dem Schwester-Repo (haushoppe-its.de und haushoppe.de): möglichst synchron halten,
// aber nicht zwingend. Bewusste Abweichungen einer Seite sind erlaubt.
//
// Prüft nach dem Build (dist/), dass Seitenübergänge nicht an doppelten Namen scheitern:
// 1. Kein view-transition-name kommt in einer HTML-Datei zweimal vor (sonst bricht der Browser
//    den ganzen Übergang ab).
// 2. Keine zwei Seiten-Pfade ergeben denselben Schlüssel (vtKey: /a-b und /a/b wären beide a-b).
// Bricht mit Code 1 ab und nennt die Fundstellen.
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(process.argv[2] ?? 'dist');
// Wie vtKey() in src/lib/view-transitions.ts (Pfad über URL normalisiert, Umlaute also kodiert).
const vtKey = (href) =>
  new URL(href, 'https://vt.invalid').pathname.replace(/\/+$/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+/, '');

const errors = [];
const keys = new Map();
let files = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name.endsWith('.html')) check(file);
  }
}

function check(file) {
  files++;
  const rel = path.relative(DIST, file).split(path.sep).join('/');
  const html = fs.readFileSync(file, 'utf8');
  const seen = new Set();
  for (const [, name] of html.matchAll(/view-transition-name:\s*([^;"'\s]+)/g)) {
    if (seen.has(name)) errors.push(`${rel}: Name „${name}“ doppelt`);
    seen.add(name);
  }
  const page = '/' + rel.replace(/(^|\/)index\.html$/, '').replace(/\.html$/, '');
  const key = vtKey(page);
  if (keys.has(key) && keys.get(key) !== page) errors.push(`Schlüssel „${key}“ für ${keys.get(key)} und ${page}`);
  keys.set(key, page);
}

walk(DIST);
if (errors.length) {
  console.error(`check-view-transitions: ${errors.length} Problem(e):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`check-view-transitions: ${files} Seiten, keine doppelten Namen oder Schlüssel.`);
