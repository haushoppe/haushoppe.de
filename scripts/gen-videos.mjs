// Videos-Liste aus der kuratierten YouTube-Playlist ziehen (Ersatz für das alte
// „Automatic YouTube Gallery"-Plugin). Schreibt src/data/videos.json = [{id,title}].
// Quelle = dieselbe Playlist, die das Plugin genutzt hat. Läuft im Build (npm run data)
// und im nächtlichen CI-Rebuild.
//
// ROBUST BY DESIGN: Ohne API-Key oder bei jedem API-Fehler bleibt die bereits
// committete Liste unverändert und das Skript endet mit Code 0 — ein Nacht-Build darf
// die Videos NIE versehentlich leeren oder das Deploy blockieren. Neu geschrieben wird
// nur, wenn wir mindestens ein gültiges Video geholt haben.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(SITE, 'src/data/videos.json');

const API_KEY = process.env.YOUTUBE_API_KEY;
// Playlist-ID ist kein Geheimnis (öffentliche Playlist) -> Default im Code, per Env überschreibbar.
const PLAYLIST_ID = process.env.YOUTUBE_PLAYLIST_ID || 'PLnPh7WJws0tvL1YjGYImlOt2bt4J4oNXE';

const keepExisting = (grund) => {
  const vorhanden = fs.existsSync(OUT);
  console.warn(`gen-videos: ${grund} -> bestehende Liste bleibt (${vorhanden ? 'vorhanden' : 'FEHLT!'}).`);
  process.exit(0); // Build/Deploy nicht blockieren
};

if (!API_KEY) keepExisting('kein YOUTUBE_API_KEY gesetzt');

// Minimaler HTML-Entity-Decoder — die YouTube-API liefert Titel teils mit &quot; &amp; &#39; …
const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

async function fetchAll() {
  const videos = [];
  let pageToken = '';
  do {
    const url =
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,status&maxResults=50` +
      `&playlistId=${encodeURIComponent(PLAYLIST_ID)}&key=${encodeURIComponent(API_KEY)}` +
      (pageToken ? `&pageToken=${pageToken}` : '');
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || data.error) {
      const reason = data.error?.errors?.[0]?.reason || res.status;
      throw new Error(`API-Fehler (${reason}): ${data.error?.message || res.statusText}`);
    }
    for (const it of data.items || []) {
      const priv = it.status?.privacyStatus;
      const id = it.snippet?.resourceId?.videoId;
      const title = it.snippet?.title || '';
      // Gelöschte/private Einträge überspringen (nicht abspielbar).
      if (!id || priv === 'private' || title === 'Private video' || title === 'Deleted video') continue;
      videos.push({ id, title: decode(title).trim() });
    }
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return videos;
}

try {
  const videos = await fetchAll();
  if (videos.length === 0) keepExisting('Playlist lieferte 0 abspielbare Videos');
  fs.writeFileSync(OUT, JSON.stringify(videos, null, 2) + '\n');
  console.log(`gen-videos: ${videos.length} Videos aus Playlist ${PLAYLIST_ID} -> src/data/videos.json`);
} catch (e) {
  keepExisting(e.message);
}
