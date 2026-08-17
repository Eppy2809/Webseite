# Valtro-Webdesign — One-Page-Website

Statische, vollständig responsive One-Page-Website für **Valtro-Webdesign** mit Angeboten für
Webseiten, Online-Shops, Web-Apps, Relaunch, Pflege, Hostinger-/WordPress-Unterstützung und Logo-Design.
Helles Papier-Theme mit Petrol als Akzent und Bernstein als Wärme, Serifen-Überschriften
und einem dunklen Band als Kontrastanker. Ohne Fremdbibliothek: reines HTML, CSS und
rund 340 Zeilen JavaScript.

## Ansehen

Es ist reines HTML/CSS/JS — kein Build-Schritt, keine Abhängigkeiten zur Laufzeit.

> **Wichtig:** Die Seite muss über einen Webserver laufen. Ein Doppelklick auf `index.html`
> (`file://`) reicht nicht: Der Browser blockiert dort die Schriftdateien, die Typografie
> fällt auf Systemschriften zurück. Layout, Formular und Reveals funktionieren, aber der
> Satz sieht falsch aus.

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
    fonts.css               @font-face für Fraunces & Inter
    style.css               Design-Tokens, Layout, Komponenten, Breakpoints
  js/
    main.js                 Navigation, Reveals, Formularprüfung, Countdown
  img/                      Logo, Open-Graph-Vorschau, Projektbild in drei Größen
  fonts/                    Vier woff2-Dateien (Variable Fonts, Subsets latin + latin-ext)
```

Es gibt kein `vendor/` mehr: three.js, GSAP und ScrollTrigger sind entfallen, weil die
Effekte entfallen sind, für die sie da waren.

## Design-Konzept

| Rolle | Wert |
|---|---|
| Flächen | Seite `#fdfbf7` (warmes Papier), Karten `#ffffff`, Tönung `#f6f2ea` |
| Text | `#1d2624`, gedämpft `#4f5c58`, zurückgenommen `#63716c` |
| Akzent | `#0d7d70` (Petrol) für Flächen, `#0a6157` für Text |
| Zweitakzent | `#e0913f` (Bernstein) für Flächen, `#9c5f12` für Text |
| Überschriften | Fraunces (Serife, variabel, mit optischer Größenachse) |
| Fließtext & Bedienelemente | Inter |
| Dunkles Band | `#14201d` mit `#f2efe8` und Petrol `#5dc8b8` |

Die Flächen heißen `--surface-0` bis `--surface-4`: 0 ist die Seite, aufsteigend liegt es
weiter oben. Jede Farbe, die Text trägt, erreicht auf Papier mindestens 4.5:1 — deshalb gibt
es zu beiden Akzenten eine dunklere `-ink`-Variante: `--accent` füllt eine Fläche,
`--accent-ink` schreibt darauf. Tiefe entsteht über weiche warme Schatten
(`--shadow-sm/-md/-lg`) statt über harte Kanten.

Zwei Familien mit klaren Rollen: die Serife trägt Überschriften, FAQ-Fragen und Preise,
die Grotesk alles Funktionale — Labels, Buttons, Formular. Fraunces' geschwungener
f-Auslauf ist die Grundform der Schrift und lässt sich nicht abschalten; er ist der Grund
für diese Wahl. Die Achsen `SOFT` und `WONK` stecken nicht im Subset, `opsz` schon.

Typografie und Abstände skalieren über `clamp()`-Tokens mit dem Viewport, das Layout ist
mobile-first aufgebaut (Breakpoints bei 640 px und 900 px).

### Rhythmus statt Raster

Die erste Fassung reihte über 9.000 Pixel immer dieselbe Figur aneinander — Label,
Überschrift, Fließtext, Raster aus gleich großen Karten. Das liest sich maschinell.
Jetzt wechselt die Form je Abschnitt: offener Hero, Leistungen als redaktionelle Zeilen
mit Trennlinien statt als Kacheln, ein **dunkles Band** für den Ablauf als Kontrastanker,
das Projekt asymmetrisch mit dominantem Bild. Das Kartenraster gibt es nur noch bei den
Preisen — dort ist es richtig, weil Pakete vergleichbar nebeneinander stehen sollen.

## Interaktion

Bewusst zurückhaltend. Entfallen sind Partikelkugel, Schlagwort-Laufband, Verlaufswort in
der Headline, hochzählende Kennzahlen, Preloader, eigener Mauszeiger, Magnet-Buttons und
Scroll-Parallaxe — jedes davon ein Standardgriff, der die Seite nach Vorlage aussehen ließ.

Übrig bleibt, was Inhalt transportiert:

- **Reveals**: sanftes Einblenden per IntersectionObserver, Gruppen leicht versetzt.
- **Navigation**: blendet beim Herunterscrollen aus, Fortschrittsbalken, aktiver Abschnitt.
- **Formular**: Prüfung im Browser mit verknüpften Fehlern und kurzem Rütteln.
- **`prefers-reduced-motion`**: alles sofort sichtbar, keine Bewegung.
- **Ohne JavaScript**: die Seite ist vollständig lesbar und das Formular bedienbar
  (`.no-js`-Klasse am `<html>`).

## Performance

Es gibt keine Fallunterscheidung nach Gerät mehr und keine nachgeladenen Bibliotheken —
die Seite ist überall gleich leicht: **rund 230 KB in 8 Requests**, davon 113 KB Schriften.
Zum Vergleich: Mit 3D-Szene und GSAP waren es gut 1 MB.

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

## Lizenzen

Es sind keine Programmbibliotheken mehr eingebunden. Verwendet werden nur zwei Schriften:

- Fraunces, Inter — SIL Open Font License 1.1
