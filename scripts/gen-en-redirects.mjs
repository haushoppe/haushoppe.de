// Hängt die EN-Slug-Redirects NUR an das _redirects der englischen Domain an (dist-art). Die alten,
// deutsch-benannten EN-URLs (haushoppe.art/portfolio/<deutscher-slug>/) leiten 301 auf die neuen
// englischen Slugs. Bewusst NICHT für dist-de: dort sind die alten Slugs die gültigen DE-URLs.
import { readFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2];
if (!dist) {
  console.error('usage: node scripts/gen-en-redirects.mjs <distDir>');
  process.exit(1);
}
const rules = JSON.parse(readFileSync(join(process.cwd(), 'src/data/en-slug-redirects.json'), 'utf8'));
const body = rules.map((r) => `${r.from}  ${r.to}  301`).join('\n');
const target = join(dist, '_redirects');
appendFileSync(
  target,
  `\n# EN-Slug-Uebersetzung: alte deutsch-benannte EN-URLs -> neue englische Slugs (nur .art).\n${body}\n`,
);
console.log(`gen-en-redirects: ${rules.length} Redirects an ${target} angehaengt`);
