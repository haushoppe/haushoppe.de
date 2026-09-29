// Sichert die Dateien der harmonisierten EU-Mitteilung zur gesetzlichen Gewährleistung: Sie müssen
// byte-identisch zu den Kommissionsdateien bleiben (Anhang I DVO (EU) 2025/1960: nicht editierbar).
// Die SVGs stehen im Checkout (GuaranteeNotice.astro), die PDFs hängen an der Kunden-Mail
// (functions/api/paypal/_email.js). Weicht eine Prüfsumme ab oder fehlt der Anhang in der Mail,
// bricht der Check und damit der Build ab.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const FILES = {
  'public/eu-gewaehrleistung-de.svg': 'fd39364dbe42fa775ff55fb9b7aa80c377a5d04219929fef86a8522eed486b1a',
  'public/eu-guarantee-en.svg': 'd1b4293b75637022b582b3025f789d292e1c845660a0460d855bbe523b9763f7',
  'public/eu-mitteilung-gesetzliche-gewaehrleistung.pdf': '1aa13d2557aff2d107fce73c3c0f5ba6ebeb0cbc86e4fe2f7311a6a1d3be1182',
  'public/eu-notice-legal-guarantee.pdf': '620b88ee6f916ca6925d6381c60848429575e32977b55d8ce56e37936dfa73be',
};

const errors = [];
for (const [file, expected] of Object.entries(FILES)) {
  const actual = createHash('sha256').update(readFileSync(file)).digest('hex');
  if (actual !== expected) errors.push(`${file}: SHA-256 ${actual}, erwartet ${expected}`);
}
const mail = readFileSync('functions/api/paypal/_email.js', 'utf8');
for (const pdf of ['eu-mitteilung-gesetzliche-gewaehrleistung.pdf', 'eu-notice-legal-guarantee.pdf']) {
  if (!mail.includes(pdf)) errors.push(`functions/api/paypal/_email.js hängt ${pdf} nicht an`);
}
if (!/attachments:\s*\[\{\s*\.\.\.EU_NOTICE_PDF/.test(mail)) errors.push('Kunden-Mail ohne EU-Mitteilung als Anhang');

if (errors.length) {
  console.error('✗ EU-Mitteilung:\n  ' + errors.join('\n  '));
  process.exit(1);
}
console.log(`✓ EU-Mitteilung: ${Object.keys(FILES).length} Kommissionsdateien byte-identisch, PDF-Anhang in der Kunden-Mail.`);
