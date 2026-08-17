# Valtro-Webdesign — One-Page-Website

Statische, vollständig responsive One-Page-Website für **Valtro-Webdesign**, 66787 Wadgassen.
Dunkles Navy/Schwarz-Theme mit Cyan/Teal als Akzent, dezenten 3D-Elementen (Three.js) und
scroll-gesteuerten Animationen (GSAP + ScrollTrigger).

## Ansehen

Es ist reines HTML/CSS/JS — kein Build-Schritt, keine Abhängigkeiten zur Laufzeit.
Wegen der ES-Module (`importmap`) muss die Seite über einen Server laufen, nicht per `file://`:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

Zum Deployen genügt es, den Ordnerinhalt auf einen beliebigen Webspace zu kopieren
(oder GitHub Pages / Netlify / Vercel auf das Repository zeigen zu lassen).

## Struktur

```
index.html                  Gesamte Seite (Nav, Hero, Leistungen, Projekte, Kontakt, Footer)
assets/
  css/
    fonts.css               @font-face für Inter & Space Grotesk
    style.css               Design-Tokens, Layout, Komponenten, Breakpoints
  js/
    main.js                 Navigation, Reveals, Zähler, Formular, Cursor, Magnet-Buttons
    hero-scene.js           Three.js-Szene im Hero (ES-Modul)
  fonts/                    Vier woff2-Dateien (Variable Fonts, Subsets latin + latin-ext)
  vendor/                   gsap.min.js, ScrollTrigger.min.js, three.module.min.js
```

## Design-Konzept

| Rolle | Wert |
|---|---|
| Hintergrund | `#04060c` → `#0b1120` (Navy-Schwarz, mehrstufig) |
| Text | `#e8eefc`, gedämpft `#93a4c4` |
| Akzent | `#22d3ee` (Cyan) → `#2dd4bf` (Teal) |
| Display-Schrift | Space Grotesk (Headlines, Zahlen, Buttons) |
| Fließtext | Inter |

Typografie und Abstände skalieren über `clamp()`-Tokens mit dem Viewport, das Layout ist
mobile-first aufgebaut (Breakpoints bei 640 px und 900 px).

## Interaktion

- **Hero-3D** (`hero-scene.js`): Partikelschale aus ~2.600 Punkten in Fibonacci-Verteilung mit
  eigenem Shader (sanftes „Atmen", Tiefenabblendung, Funkeln), dazu zwei Draht-Ikosaeder und
  leichte Maus-Parallaxe. Rendert nur, wenn der Hero sichtbar und der Tab aktiv ist;
  Pixel-Ratio ist auf 2 begrenzt, auf schmalen Displays werden weniger Partikel erzeugt.
- **GSAP**: Preloader-Zähler, wortweise einlaufende Headline, gestaffelte Reveals per
  ScrollTrigger, Parallaxe auf Hero und Projektbildern, Endlos-Laufband, magnetische Buttons,
  Zähler in der Hero-Statistik.
- **Ohne JS/GSAP**: Die Seite bleibt vollständig lesbar — Reveals laufen dann über einen
  IntersectionObserver, bei komplett deaktiviertem JavaScript ist alles sofort sichtbar
  (`.no-js`-Klasse am `<html>`).
- **`prefers-reduced-motion`**: schaltet Animationen und die 3D-Szene ab.

## Barrierefreiheit

Skip-Link, sichtbarer Fokus-Ring, `aria-expanded`/`aria-controls` am Menü-Button,
`aria-live` für Formularmeldungen, `aria-invalid` an fehlerhaften Feldern,
dekorative Grafiken mit `aria-hidden`, Bedienung komplett per Tastatur möglich.

## Kontaktformular

Die Validierung (Name, E-Mail, Nachricht, Einwilligung) läuft im Browser. Da die Seite statisch
ist, wird die fertige Anfrage anschließend an das E-Mail-Programm des Besuchers übergeben
(`mailto:kontakt@valtro.cloud`).

Für echten Serverversand in `assets/js/main.js` im `submit`-Handler den `mailto`-Block durch
einen `fetch()`-Aufruf an den gewünschten Endpunkt ersetzen (eigenes PHP-Skript, Formspree,
Netlify Forms o. ä.) — die Validierung davor kann unverändert bleiben.

## Vor dem Livegang anpassen

1. **Impressum** im Footer: Die in `[eckigen Klammern]` markierten Angaben (Inhaber, Straße,
   ggf. USt-IdNr.) ergänzen. Ohne vollständige Angaben ist das Impressum nicht rechtskonform.
2. **Datenschutzerklärung** ergänzen und im Footer verlinken — bei einem Kontaktformular
   ist sie Pflicht.
3. **Projekte**: Die sechs Einträge im Abschnitt `#projekte` sind Platzhalter mit generierten
   Verläufen statt Bildern. Echte Referenzen eintragen und bei Bedarf `.project__media`
   auf `<img>` umstellen.
4. **Domain** in `<link rel="canonical">` und den Open-Graph-Metadaten prüfen.
5. Optional ein Open-Graph-Bild (1200 × 630) ergänzen und als `og:image` verlinken.

## Datenschutz

Die Seite lädt **keine** externen Ressourcen: Schriften und Bibliotheken liegen lokal im
Repository, es gibt keine Requests an Google Fonts oder ein CDN und keine Cookies oder
Tracking-Skripte.

## Lizenzen der Bibliotheken

- [three.js](https://threejs.org) 0.169.0 — MIT
- [GSAP](https://gsap.com) 3.12.5 inkl. ScrollTrigger — GSAP Standard License
- Inter, Space Grotesk — SIL Open Font License 1.1
