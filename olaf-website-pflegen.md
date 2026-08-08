<!--
Kurzanleitung für Olaf: Website-Inhalte ändern und als Pull Request einreichen.
WICHTIG: Änderungen laufen über claude.ai/code (Claude Code on the web) — NICHT über den
claude.ai-Projekt-Chat. Der Projekt-Chat ist read-only und kann nur „Patch-Dateien" erzeugen,
niemals Pull Requests. claude.ai/code ist im Claude-Pro-Abo enthalten (Research Preview).
-->

# HAUS HOPPE — Website ändern (für Olaf)

**Nutze dafür Claude Code im Web: https://claude.ai/code** — das ist in deinem Claude-Pro-Abo enthalten. Du beschreibst die Änderung auf Deutsch, Claude legt automatisch einen **Pull Request** an, Johannes prüft und gibt frei.

> ⚠️ **Nicht** den normalen claude.ai-**Projekt-Chat** für Änderungen benutzen — der kann nur eine „Patch-Datei" erzeugen, keinen Pull Request. Deshalb hat der erste Versuch nicht geklappt.

## Einmalig einrichten (2 Minuten)
1. **https://claude.ai/code** öffnen, mit deinem Claude-Konto anmelden.
2. Wenn gefragt: die **Claude-GitHub-App autorisieren** (Zugriff aufs Repo erlauben).

## Eine Änderung machen
1. Oben das Repo **`haushoppe/haushoppe.de`** auswählen.
2. Die Änderung auf Deutsch beschreiben, z. B.:
   - „Ändere die Öffnungszeiten auf der Kontaktseite auf 14–18 Uhr."
   - „Trag in der Vita die Ausstellung 2025, Kunsthalle Wittenhagen ein."
3. Claude arbeitet, baut die Seite und legt einen **Branch** an.
4. Du siehst die Änderung als Diff — klick **„Create PR"** (oder sag „Erstelle den Pull Request").
5. Fertig: der Pull Request erscheint auf GitHub. **Johannes prüft und merged** → dann ist es live.

Die Regeln (immer **Deutsch + Englisch**, nur Inhalts-Dateien, Build muss grün sein) stehen im Repo in **`CLAUDE.md`** und werden von claude.ai/code **automatisch geladen**. Du musst dich um nichts kümmern — Claude hält sich daran.

## Wenn die automatische Prüfung (CI) rot ist
Kein Problem: im PR die **Auto-fix**-Funktion einschalten (oder Claude sagen „behebe die CI-Fehler"), dann korrigiert Claude es selbst und aktualisiert den PR.
