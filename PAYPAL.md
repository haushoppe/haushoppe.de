# PayPal-Direktkauf für Holzschnitte

Alle Holzschnitte lassen sich direkt kaufen: **785 EUR ungerahmt, 1.000 EUR gerahmt, versandkostenfrei**
innerhalb Deutschlands, Lieferung innerhalb von 7 Tagen. Online bestellbar nur mit Lieferadresse in
Deutschland (`SHIP_COUNTRIES` in `functions/api/paypal/_paypal.js`); für andere Länder verweist die
Kaufbox auf eine Anfrage per E-Mail an team@haushoppe.de. Auf der Werk-Detailseite erscheint eine Kaufbox
mit PayPal Smart Buttons. Der Kunde zahlt mit PayPal oder Karte, PayPal erhebt dabei die
**Lieferadresse** selbst. Zahlung + Adresse landen im PayPal-Konto von Olaf, dazu gehen Bestell-Mails
an Kunde und Olaf (siehe unten).

## Bestellablauf (Button-Lösung, § 312j BGB)

Zweistufig, weil die Bestellschaltfläche nach § 312j Abs. 3 BGB „zahlungspflichtig bestellen" (oder
eindeutig gleichbedeutend) heißen muss und PayPal diese Beschriftung nicht zulässt. Fehlt sie, kommt
mit Verbrauchern kein Vertrag zustande (Abs. 4; BGH, 09.10.2025, I ZR 159/24).

1. Der PayPal-Button gibt nur die Zahlung frei: SDK mit `commit=false`, Order mit
   `user_action: CONTINUE`. PayPal beschriftet seinen Abschluss dadurch mit „Weiter".
2. `check-order` prüft das von PayPal erhobene Lieferland. Liegt es nicht in `SHIP_COUNTRIES`,
   erscheint sofort der Hinweis auf die E-Mail-Anfrage, es gibt keine Kassen-Stufe.
3. Zurück in der Kaufbox: Zusammenfassung (Werk, Ausführung, Preis, Hinweise) und der eigene Button
   **„Zahlungspflichtig bestellen"**. Die Ausführung ist ab der Freigabe gesperrt, „Abbrechen oder
   Ausführung ändern" setzt zurück.
4. Erst dieser Button ruft `capture-order` auf, prüft das Lieferland erneut und bucht ab.

Die E2E (`e2e/paypal.spec.ts`) ersetzt das SDK durch eine Attrappe und prüft genau diese
Reihenfolge: kein Bestellbutton vor der Freigabe, keine Abbuchung durch die Freigabe.

**Regel:** Die Kaufbox nie wieder so bauen, dass der PayPal-Button selbst abbucht.

## Architektur

- **Client:** `src/components/WoodcutBuy.astro` — nur auf Holzschnitten eingebunden (`ArtworkBody.astro`).
  Lädt das PayPal-SDK erst, nachdem `/api/paypal/config` eine Client-ID geliefert hat.
- **Server (Cloudflare Pages Functions):** `functions/api/paypal/`
  - `config.js` → `GET /api/paypal/config` — liefert Client-ID + sandbox/live an den Client.
  - `create-order.js` → `POST /api/paypal/create-order` — legt die Bestellung an. **Der Betrag
    (785 EUR) wird server-seitig gesetzt** — der Client kann den Preis nicht manipulieren.
  - `capture-order.js` → `POST /api/paypal/capture-order` — bucht final ab.
  - `_paypal.js` — gemeinsame Helfer (Token, Base-URL, Preis). Führendes `_` = keine Route.

Das **Secret verlässt nie den Server.** Der Client kennt nur die (öffentliche) Client-ID.

### Deploy

`functions/` liegt im Projekt-Root. Beide Deploys (`npm run deploy:de` / `deploy:art`) laufen aus
`site/`, darum hängt Wrangler dasselbe `functions/` an **beide** Cloudflare-Projekte
(`haushoppe-de` **und** `haushoppe-art`). Es ist nichts an den Deploy-Skripten zu ändern.

## Testkauf (echter PayPal-Weg für 1 Cent)

Versteckte Seite **`/testkauf/`** (haushoppe.de und haushoppe.art): dieselbe Kaufbox mit einer
einzigen Variante „Testprodukt" zu **0,01 €**, wird nicht versendet. Nicht verlinkt, `noindex`, nicht
in Sitemap und Suche. Der Cent-Preis ist serverseitig fest an die Kennung `testkauf` gebunden
(`TEST_PRODUCT` in `functions/api/paypal/_paypal.js`): create-order setzt Kennung und Bezeichnung
selbst, capture-order akzeptiert 0.01 nur für diese Kennung. Kein Werk lässt sich zum Testpreis
kaufen. Die Bestell-Mails tragen die Bezeichnung „Testbestellung, wird nicht versendet". Testkäufe
danach in PayPal erstatten.

## Einmal einzurichten (Olaf)

### 1. PayPal-REST-App anlegen

1. <https://developer.paypal.com> → **Apps & Credentials**.
2. Oben zwischen **Sandbox** und **Live** umschalten.
3. **Create App** → Typ „Merchant". Danach **Client ID** und **Secret** notieren.
4. Für Tests zuerst **Sandbox**, für den echten Verkauf später **Live** (eigene Zugangsdaten).

### 2. Variablen in BEIDEN Cloudflare-Projekten setzen

Für `haushoppe-de` **und** `haushoppe-art` (Dashboard → Pages → Projekt → *Settings → Environment
variables*), oder per CLI:

```bash
# Secret (verschlüsselt) — für beide Projekte:
wrangler pages secret put PAYPAL_CLIENT_SECRET --project-name=haushoppe-de
wrangler pages secret put PAYPAL_CLIENT_SECRET --project-name=haushoppe-art
```

Plus zwei normale Variablen (im Dashboard oder ebenfalls als Secret):

| Variable             | Wert                        |
| -------------------- | --------------------------- |
| `PAYPAL_ENV`         | `sandbox` (Test) / `live`   |
| `PAYPAL_CLIENT_ID`   | Client-ID der PayPal-App    |
| `PAYPAL_CLIENT_SECRET` | Secret der PayPal-App (verschlüsselt) |

Fehlt die Client-ID, bleibt die Kaufbox ohne Buttons — der **E-Mail-CTA** übernimmt (kein Fehler).

### 3. Sandbox testen

1. `PAYPAL_ENV=sandbox` + Sandbox-Zugangsdaten setzen, neu deployen.
2. Auf <https://developer.paypal.com> unter *Sandbox → Accounts* ein Test-Käuferkonto nutzen.
3. Einen Holzschnitt „kaufen", mit dem Sandbox-Käufer zahlen.
4. Bestellung + Lieferadresse erscheinen im Sandbox-Business-Konto.

### 4. Live schalten

`PAYPAL_ENV=live` + Live-Zugangsdaten in beiden Projekten setzen, neu deployen.

## Lokal testen (optional)

`astro dev`/`preview` führen **keine** Functions aus (Buttons erscheinen dort nicht). Für die
Functions:

```bash
cp .dev.vars.example .dev.vars   # Sandbox-Werte eintragen (nicht committen)
npm run build:de
wrangler pages dev dist-de       # bedient /api/paypal/* lokal
```

## Bestätigungs-E-Mails (Resend)

Nach erfolgreicher Zahlung verschickt `capture-order.js` über `_email.js` zwei Mails via
[Resend](https://resend.com):

- **an den Kunden** (Sprache der Werk-Seite): Eingangsbestätigung mit allen Bestelldaten +
  Widerrufsbelehrung + Hinweis „Vertrag kommt erst mit Versand zustande".
  **Anhang:** die EU-Mitteilung zur gesetzlichen Gewährleistung als offizielles PDF der Kommission
  (DE: `public/eu-mitteilung-gesetzliche-gewaehrleistung.pdf`, EN: `public/eu-notice-legal-guarantee.pdf`),
  byte-identisch, mit genau einem Beschriftungssatz im Mail-Text. Grund: § 312f Abs. 2 BGB (die
  Bestätigung muss die Angaben nach Art. 246a EGBGB enthalten, seit 27.09.2026 auch Nr. 11). Da die
  Mail vor Vertragsschluss (Versand) rausgeht, erfüllt sie das als dauerhafter Datenträger. Das PDF
  hat getaggten Text mit Sprachangabe, ist also für Screenreader lesbar. Prüfsummen sichert
  `scripts/check-eu-notice.mjs` in `npm run check`. Offen (nicht geprüft): ob das PDF die RGB-Vorgabe
  von Anhang I Erl. 5 erfüllt.
- **an Olaf** (`team@haushoppe.de`): dieselbe Bestellung mit Käufer, Adresse und Zahlungsreferenz.

Der Versand läuft über `waitUntil` im Hintergrund und kann die Zahlung nie scheitern lassen. Ohne
`RESEND_API_KEY` wird nichts verschickt (die Zahlung funktioniert trotzdem).

**Einzurichten:**

1. Bei Resend registrieren, die Domain **haushoppe.de** verifizieren (DKIM/SPF-DNS-Einträge, die
   Resend vorgibt, in Cloudflare-DNS eintragen), damit `team@haushoppe.de` als Absender zulässig ist.
2. API-Key erzeugen und in **beiden** Cloudflare-Projekten als Secret setzen:
   ```bash
   wrangler pages secret put RESEND_API_KEY --project-name=haushoppe-de
   wrangler pages secret put RESEND_API_KEY --project-name=haushoppe-art
   ```
   Optional: `MAIL_FROM` (Default `HAUS HOPPE - ITS <team@haushoppe.de>`) und `MAIL_TO` (Default
   `team@haushoppe.de`) überschreiben.

## Rechtstexte

Footer-Seiten (DE + EN) unter `src/content/pages/`: `impressum`, `datenschutz`, `agb`, `widerruf`
(EN: `imprint`, `privacy`, `terms`, `right-of-withdrawal`),
dazu die Widerrufsfunktion `widerruf-erklaeren` / `withdraw` (§ 356a BGB). Aus haushoppe-its übernommen und auf
Olaf/haushoppe.de angepasst; Datenschutz um **PayPal** und **Resend** erweitert. Der Vertrag kommt
laut Seite + AGB + E-Mail **erst mit Versand** zustande (Eingangsbestätigung ist keine Annahme).

**EU-Gewährleistungs-Mitteilung** (Art. 246a § 1 Abs. 1 Nr. 11 EGBGB, Gestaltung DVO (EU) 2025/1960,
Pflicht seit 27.09.2026): Komponente `src/components/GuaranteeNotice.astro`, als vollständige Grafik
in der Kassen-Stufe vor „Zahlungspflichtig bestellen" (nicht hinter einem Link: die DVO erlaubt das
Verschachteln nur für das GARAN-Label, Erwägungsgrund 14). Die Dateien `public/eu-gewaehrleistung-de.svg`
und `public/eu-guarantee-en.svg` stammen **unverändert** aus dem SVG-Paket der Kommission
(<https://commission.europa.eu/publications/practical-guidelines-and-high-resolution-vector-files-eu-notice-and-label-product-guarantees_en>)
und dürfen nicht verändert werden (Anhang I der DVO). Sichtbar sind nur die Grafik und das QR-Ziel
als Link; der vollständige Wortlaut steht daneben nur für Screenreader. **Regel:** Den Inhalt der
Mitteilung nirgends in eigenen Worten wiedergeben oder zusammenfassen (keine eigene Seite, keine
Umschreibung in AGB oder Mail), und die Grafik nicht klickbar machen.

**Produktsicherheitsverordnung (EU) 2023/988 gilt nicht** für die Holzschnitte: Sie nimmt
„Antiquitäten" aus (Art. 2 Abs. 2 Buchst. i), darunter nach Art. 3 Nr. 28 Kunstwerke; Erwägungsgrund 18
verweist zur Abgrenzung auf Anhang IX der RL 2006/112/EG, der „Originalstiche, -schnitte und
-steindrucke" aus vom Künstler handgearbeiteten Platten in begrenzter Zahl ausdrücklich nennt.
Grenzfall ohne abschließende Prüfung: die gerahmte Ausführung (HALBE-Rahmen mit Glas).

**Noch zu prüfen:**

- Exakten **Firmennamen** bestätigen (USt-IdNr. DE 159112438 ist eingetragen).
- Zuständige **Datenschutz-Aufsichtsbehörde** (aktuell Mecklenburg-Vorpommern angenommen).
- Alle Rechtstexte **juristisch prüfen** lassen (Adaption, keine Rechtsberatung).
