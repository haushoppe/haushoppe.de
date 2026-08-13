# PayPal-Direktkauf für Holzschnitte

Alle 30 Holzschnitte lassen sich direkt kaufen: **785 EUR, versandkostenfrei**. Auf der Werk-
Detailseite erscheint eine Kaufbox mit PayPal Smart Buttons. Der Kunde zahlt mit PayPal oder Karte,
PayPal erhebt dabei die **Lieferadresse** selbst. Zahlung + Adresse landen im PayPal-Konto von Olaf,
darum ist (vorerst) **keine Bestätigungsmail** nötig.

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

## Rechtlicher Hinweis (offen, bitte mit Olaf klären)

Ein direkter „Jetzt kaufen"-Verkauf an Verbraucher in DE zieht Pflichten nach sich:
**Widerrufsbelehrung, AGB, Datenschutz-Passus zu PayPal, korrekter MwSt-Ausweis**. Das ist hier
**noch nicht** umgesetzt. Vor dem Live-Schalten juristisch prüfen lassen.
