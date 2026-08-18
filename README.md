# Valtro-Webdesign — One-Page-Website

Responsive One-Page-Website für **Valtro-Webdesign** mit Angeboten für
Webseiten, Online-Shops, Web-Apps, Relaunch, Pflege, Hostinger-/WordPress-Unterstützung und Logo-Design.
Plakative Bildsprache: fette Groteske für Überschriften, dunkle Vollformat-Bänder im Wechsel
mit hellen Abschnitten, dazu ein einzelnes Signal-Orange als wiederkehrendes Flächenmotiv.
Ohne Fremdbibliothek im Frontend: HTML, CSS und JavaScript sowie ein kleiner selbst
gehosteter Python-Dienst für das Kontaktformular.

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

Die öffentlichen Dateien werden mit `deploy/deploy-static.sh` veröffentlicht. Servercode,
Konfigurationen und Zugangsdaten werden bewusst nicht in das Webverzeichnis kopiert.

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
    fonts.css               @font-face für Anton & Inter
    style.css               Design-Tokens, Layout, Komponenten, Breakpoints
  js/
    main.js                 Navigation, Reveals, Formularprüfung, Countdown
  img/                      Logo, Open-Graph-Vorschau, Projektbild in drei Größen
  fonts/                    Vier woff2-Dateien (Variable Fonts, Subsets latin + latin-ext)
server/                     Selbst gehosteter Kontaktformular-Dienst und Tests
deploy/                     Nginx-, Systemd-, Backup- und Deployment-Dateien
```

Es gibt kein `vendor/` mehr: three.js, GSAP und ScrollTrigger sind entfallen, weil die
Effekte entfallen sind, für die sie da waren.

## Design-Konzept

| Rolle | Wert |
|---|---|
| Flächen | Seite `#faf9f7`, Karten `#ffffff`, Tönung `#f1efec`, tief `#e6e3de` |
| Text | `#171716`, gedämpft `#55534e` (7.3:1), zurückgenommen `#6b6862` (5.3:1) |
| Akzent | `#b3401a` (Rost) — die einzige Farbe der Seite |
| Fehler | `#8f1d14` (tiefes Karmin, klar vom Akzent getrennt) |
| Dunkles Band | `#1a1a18` mit `#f5f4f1` |
| Plakat-Orange | `#e85b26` — rein dekorativ, nur Flächen, kein Text |
| Überschriften | Anton (fette, kondensierte Groteske) |
| Fließtext & Bedienelemente | Inter |

Die Flächen heißen `--surface-0` bis `--surface-3`: 0 ist die Seite, aufsteigend liegt es
weiter oben. Tiefe entsteht über weiche warme Schatten (`--shadow-sm/-md/-lg`) statt über
harte Kanten.

**Eine Farbe, ein Token.** `#b3401a` trägt Text auf Papier (5.4:1) und Weiß auf sich selbst
(5.7:1) — deshalb braucht es keine hellere/dunklere Zweitvariante. Der Akzent markiert
ausschließlich Handlungen und Zustände: Primärbutton, Links, Fokusring, Neukundenband,
Statuspunkt, Haken in den Preislisten. Abschnitts-Labels, Ziffern und Kicker sind
neutral — Farbe, die überall steht, sagt nichts mehr.

**Kanaltripel für getönte Flächen.** Durchscheinende Leisten und Verlaufsflächen brauchen
Zahlenwerte und können `var(--accent)` nicht verwenden. Deshalb steht neben jedem Farbwert
sein Kanaltripel (`--accent-rgb: 179 64 26`), aus dem sich `rgb(var(--accent-rgb) / .38)`
bilden lässt. Ein Farbwechsel bleibt dadurch im `:root`-Block; früher waren rund 20
Literale über das Stylesheet verstreut. Fest bleiben nur zwei Werte: `#0a0a0c` hinter dem
Valtro-Pay-Bild (fremde Marke) und `#fff`/`#000` in der Druckregel.

Andere Akzente sind der Tausch einer Zeile — geprüft und ebenfalls AA-konform sind
Tintenblau `#1e4b8f` und Moosgrün `#3f5d3a`.

Zwei Familien mit klaren Rollen: die fette Groteske trägt Überschriften, FAQ-Fragen und
Preise, die schmalere Groteske alles Funktionale — Labels, Buttons, Formular. Anton liegt
nur in einem, bereits sehr fetten Schnitt vor; Überschriften fordern deshalb bewusst
`font-weight: 400` an, sonst würde der Browser zusätzlich fake-bold simulieren.

Das wiederkehrende Orange-Quadrat (`.mark-block`, `.eyebrow::before`) ist reine Fläche,
nie Symbol oder Text — es markiert Abschnittsanfänge auf den dunklen Bändern und vor jedem
Rubriken-Label, ohne selbst etwas zu bedeuten.

Typografie und Abstände skalieren über `clamp()`-Tokens mit dem Viewport, das Layout ist
mobile-first aufgebaut (Breakpoints bei 640 px und 900 px).

### Rhythmus statt Raster

Die Seite wechselt hell und dunkel im Wechsel statt durchgehend eine Fläche zu bleiben:
dunkler Hero, helle Leistungen als redaktionelle Zeilen mit Trennlinien statt Kacheln,
ein **dunkles Band** für den Ablauf, die einzige veröffentlichte Arbeit noch einmal
dunkel mit Graustufen-Bild und Orange-Akzent, dann wieder hell bis zum Footer. Das
Kartenraster gibt es nur bei den Preisen — dort ist es richtig, weil Pakete vergleichbar
nebeneinander stehen sollen.

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

Die Validierung (Name, E-Mail, Leistung, Nachricht, Datenschutzhinweis) läuft im Browser und
noch einmal unabhängig auf dem eigenen Server. CTAs aus Leistungen und Preisen wählen die
passende Leistung automatisch vor. Gültige Anfragen werden nur an `/api/contact` gesendet.
Honeypot, Zeitprüfung, Herkunftsprüfung, Größenlimit, serverseitige Validierung und zwei
Anfragelimits reduzieren Spam. Es werden weder FormSubmit noch reCAPTCHA eingesetzt.

Der Python-Dienst stellt Nachrichten per TLS über das konfigurierte E-Mail-Postfach zu.
Vorübergehende Zustellfehler liegen maximal sieben Tage in einer nur für den Dienst lesbaren
Warteschlange. Systemd startet den Dienst neu und versucht die Zustellung regelmäßig erneut.

## Vor dem Livegang anpassen

1. **Formular konfigurieren**: SMTP-Daten ausschließlich in `/etc/valtro-contact.env`
   hinterlegen und den internen Healthcheck erfolgreich prüfen.
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
Tracking-Skripte. Das Kontaktformular überträgt Daten ausschließlich verschlüsselt an den
eigenen Server; externe Formular- oder CAPTCHA-Dienste sind nicht beteiligt. Details stehen in
`datenschutz.html`. Das Hosting erfolgt über Hostinger.

## Lizenzen

Es sind keine Programmbibliotheken mehr eingebunden. Verwendet werden nur zwei Schriften:

- Anton, Inter — SIL Open Font License 1.1
