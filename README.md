# Valtro-Webdesign — One-Page-Website

Statische, vollständig responsive One-Page-Website für **Valtro-Webdesign** mit Angeboten für
Webseiten, Online-Shops, Web-Apps, Relaunch, Pflege, Hostinger-/WordPress-Unterstützung und Logo-Design.
Helles Papier-Theme mit Petrol als Akzent und Bernstein als Wärme, dezenten 3D-Elementen
(Three.js) und scroll-gesteuerten Animationen (GSAP + ScrollTrigger).

## Ansehen

Es ist reines HTML/CSS/JS — kein Build-Schritt, keine Abhängigkeiten zur Laufzeit.

> **Wichtig:** Die Seite muss über einen Webserver laufen. Ein Doppelklick auf `index.html`
> (`file://`) reicht nicht: Der Browser blockiert dort ES-Module und Schriftdateien, dadurch
> bleibt der 3D-Hero leer und die Typografie fällt auf Systemschriften zurück. Layout,
> Animationen und Formular funktionieren, der Rest sieht falsch aus.

### Lokal starten

Im Projektordner einen der beiden Befehle ausführen und die angezeigte Adresse im Browser
öffnen. Beenden mit `Strg+C`.

```bash
# mit Python (unter Windows: python statt python3)
python3 -m http.server 8000
# → http://localhost:8000
```

```bash
# alternativ mit Node.js — öffnet den Browser und lädt bei jedem Speichern neu
npx live-server
```

### Veröffentlichen

Zum Deployen genügt es, den Ordnerinhalt auf einen beliebigen Webspace zu kopieren
(oder GitHub Pages / Netlify / Vercel auf das Repository zeigen zu lassen).

## Struktur

```
index.html                  Gesamte Seite (Nav, Hero, Leistungen, Preise, Projekt, FAQ, Kontakt, Footer)
impressum.html              Anbieterkennzeichnung
datenschutz.html            Datenschutzerklärung inkl. Formularversand
danke.html                  Zielseite nach erfolgreichem Formularversand
robots.txt                  Freigaben für Suchmaschinen-Crawler
sitemap.xml                 Sitemap für Suchmaschinen
assets/
  css/
    fonts.css               @font-face für Inter & Space Grotesk
    style.css               Design-Tokens, Layout, Komponenten, Breakpoints
  js/
    main.js                 Navigation, Reveals, Zähler, Formular, Cursor, Magnet-Buttons
    hero-scene.js           Three.js-Szene im Hero (ES-Modul, wird nachgeladen)
  img/                      Logo, Open-Graph-Vorschau, Projektbild in drei Größen
  fonts/                    Vier woff2-Dateien (Variable Fonts, Subsets latin + latin-ext)
  vendor/                   gsap.min.js, ScrollTrigger.min.js, three.module.min.js
```

`main.js` bindet `hero-scene.js` und `ScrollTrigger.min.js` selbst ein, sobald das Gerät
dafür in Frage kommt — beide stehen deshalb nicht als `<script>` in der HTML.

## Design-Konzept

| Rolle | Wert |
|---|---|
| Flächen | Seite `#fdfbf7` (warmes Papier), Karten `#ffffff`, Tönung `#f6f2ea` |
| Text | `#1d2624`, gedämpft `#4f5c58`, zurückgenommen `#63716c` |
| Akzent | `#0d7d70` (Petrol) für Flächen, `#0a6157` für Text |
| Zweitakzent | `#e0913f` (Bernstein) für Flächen, `#9c5f12` für Text |
| Display-Schrift | Space Grotesk (Headlines, Zahlen, Buttons) |
| Fließtext | Inter |

Die Flächen heißen `--surface-0` bis `--surface-4`: 0 ist die Seite, aufsteigend liegt es
weiter oben. Jede Farbe, die Text trägt, erreicht auf Papier mindestens 4.5:1 — deshalb gibt
es zu beiden Akzenten eine dunklere `-ink`-Variante: `--accent` füllt eine Fläche,
`--accent-ink` schreibt darauf. Tiefe entsteht über weiche warme Schatten
(`--shadow-sm/-md/-lg`) statt über harte Kanten.

Typografie und Abstände skalieren über `clamp()`-Tokens mit dem Viewport, das Layout ist
mobile-first aufgebaut (Breakpoints bei 640 px und 900 px).

## Interaktion

- **Hero-3D** (`hero-scene.js`): Partikelschale aus ~2.000 Punkten in Fibonacci-Verteilung mit
  eigenem Shader (sanftes „Atmen", Tiefenabblendung, Funkeln), dazu zwei Draht-Ikosaeder und
  leichte Maus-Parallaxe. Rendert nur, wenn der Hero sichtbar und der Tab aktiv ist;
  Pixel-Ratio ist auf 2 begrenzt. **Läuft ausschließlich am Desktop**, siehe Performance.
- **GSAP**: Preloader-Zähler, wortweise einlaufende Headline, gestaffelte Reveals per
  ScrollTrigger, Parallaxe auf Hero und Projektbildern, Endlos-Laufband, magnetische Buttons,
  Zähler in der Hero-Statistik.
- **Ohne JS/GSAP**: Die Seite bleibt vollständig lesbar — Reveals laufen dann über einen
  IntersectionObserver, bei komplett deaktiviertem JavaScript ist alles sofort sichtbar
  (`.no-js`-Klasse am `<html>`).
- **`prefers-reduced-motion`**: schaltet Animationen und die 3D-Szene ab.

## Performance

Auf dem Handy zählt jedes Kilobyte und jeder Scroll-Frame. Die Seite lädt und rechnet deshalb
nach Gerät gestaffelt — entschieden wird nicht über die Bildschirmbreite allein, sondern über
Zeigerart, Viewport, `prefers-reduced-motion` und `navigator.connection.saveData`:

| | Handy / Touch | Desktop |
|---|---|---|
| three.js (671 KB) | wird nicht geladen | als `<script type="module">` nachgehängt |
| ScrollTrigger (42 KB) | wird nicht geladen | von `main.js` nachgeladen |
| Reveals | IntersectionObserver | ScrollTrigger, gestaffelt |
| Scroll-Parallaxe (`scrub`) | aus | an |
| Karten-Spotlight & Tilt | aus | an |
| Preloader | übersprungen | 0,7 s |
| `backdrop-filter` auf fixierten Leisten | aus | an |

Das Laufband läuft bewusst überall durch, ohne Sichtbarkeits-Pause: eine solche Pause blieb
auf iOS beim Momentum-Scrollen gelegentlich hängen. Sie spart auch nichts — im
Hintergrund-Tab hält der Browser `requestAnimationFrame` von selbst an.

Ergebnis: **rund 280 KB auf dem Handy** statt gut 1 MB, und beim Scrollen bleibt dort im
Wesentlichen Layout und Compositing übrig. Ohne die 3D-Szene trägt der CSS-Verlauf den Hero
weiter — es fehlt nichts, es ist nur ruhiger.

Das Projektbild liegt in drei Größen vor und wird per `srcset`/`sizes` gewählt
(700 px ≈ 16 KB, 1200 px ≈ 32 KB, Original 1712 px ≈ 127 KB).

## Barrierefreiheit

Skip-Link, sichtbarer Fokus-Ring, `aria-expanded`/`aria-controls` am Menü-Button,
verknüpfte Inline-Fehler und fokussierbare Fehlerzusammenfassung im Formular,
`aria-invalid` an fehlerhaften Feldern, dekorative Grafiken mit `aria-hidden` und
Bedienung komplett per Tastatur.

## Kontaktformular

Die Validierung (Name, E-Mail, Leistung, Nachricht, Einwilligung) läuft im Browser. Ein optionaler
Budgetrahmen qualifiziert die Anfrage vor. CTAs aus Leistungen und Preisen wählen die passende
Leistung automatisch vor. Gültige Anfragen werden per POST an FormSubmit gesendet; Honeypot,
Zeitprüfung, Blacklist und das dort standardmäßig aktive reCAPTCHA reduzieren Spam.

Beim ersten echten Absenden verschickt FormSubmit eine Aktivierungs-E-Mail an
`kontakt@valtro.cloud`. Erst nach Bestätigung dieses Links werden weitere Anfragen zugestellt.

## Vor dem Livegang anpassen

1. **Formular aktivieren**: Einmal absenden und den Bestätigungslink in der Aktivierungs-E-Mail
   an `kontakt@valtro.cloud` anklicken.
2. **Projektbild Valtro Pay**: Das Bild liegt als `valtro-pay.jpg` (Original),
   `valtro-pay-1200.jpg` und `valtro-pay-700.jpg` in `assets/img/` und wird unterhalb des
   sichtbaren Bereichs verzögert geladen. Bei einem Austausch alle drei Größen neu erzeugen,
   die dunkle Bildwirkung und ein Seitenverhältnis nahe 3:2 beibehalten.
3. **Weitere Projekte** erst nach echter Veröffentlichung ergänzen; derzeit wird ausschließlich
   Valtro Pay als Live-Referenz gezeigt.
4. **Domain** in Canonical, Open-Graph-Metadaten, `robots.txt` und `sitemap.xml` prüfen.
5. **Preise und Leistungsumfang** vor Veröffentlichung geschäftlich bestätigen; aktuell sind
   vier unverbindliche Ab-Preise sowie individuelle Angebote für Shops und Web-Apps hinterlegt.
6. **Suchmaschinen**: `sitemap.xml` nach dem Livegang in Google Search Console einreichen.

## Datenschutz

Beim normalen Seitenaufruf lädt die Seite **keine** externen Schriften, Bibliotheken oder
Tracking-Skripte. Erst beim Absenden des Kontaktformulars werden die Formulardaten an FormSubmit
übertragen; der dortige Spam-Schutz kann reCAPTCHA einsetzen. Details stehen in
`datenschutz.html`. Das Hosting erfolgt über Hostinger.

## Lizenzen der Bibliotheken

- [three.js](https://threejs.org) 0.169.0 — MIT
- [GSAP](https://gsap.com) 3.12.5 inkl. ScrollTrigger — GSAP Standard License
- Inter, Space Grotesk — SIL Open Font License 1.1
