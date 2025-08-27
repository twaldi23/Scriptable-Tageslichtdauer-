// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: magic;
/*
Benzinverbrauch-Widget mit Preis und Logging

Bedienung:
- Parameterübergabe im Format: "Liter|Kilometer|Preis" (z.B. 44.5|635|1.89)
- Bei jeder Änderung werden Berechnungszeitpunkt, Liter, Kilometer, Verbrauch und Benzinpreis protokolliert.
- Die Logdatei ("Benzinverbrauch-Log.txt") befindet sich im Scriptable-Verzeichnis und ist fortlaufend.
- Das Widget zeigt Verbrauch (l), Benzinpreis (€/l), Datum & Uhrzeit der letzten Eingabe und ein großes Tankstellen-Icon.
*/

const fm = FileManager.iCloud();
const dir = fm.documentsDirectory();
const markerFile = fm.joinPath(dir, "last_petrol_calc.json");
const logFile = fm.joinPath(dir, "Benzinverbrauch-Log.txt");

// Parameter: Liter|Kilometer|Preis
let params = args.widgetParameter ? args.widgetParameter : "44.5|635|1.89";
let [liter, km, preis] = params.split("|").map(Number);

// Prüfung auf Änderung
let calcData = {liter, km, preis};
let lastInfo = fm.fileExists(markerFile)
  ? JSON.parse(fm.readString(markerFile))
  : {liter: null, km: null, preis: null, timestamp: null};

let timestamp;
let isNew = false;
if (
  calcData.liter !== lastInfo.liter ||
  calcData.km !== lastInfo.km ||
  calcData.preis !== lastInfo.preis
) {
  timestamp = new Date();
  let info = {liter, km, preis, timestamp: timestamp.toISOString()};
  fm.writeString(markerFile, JSON.stringify(info));
  isNew = true;
} else {
  timestamp = lastInfo.timestamp ? new Date(lastInfo.timestamp) : new Date();
}

let datum = timestamp.toLocaleDateString('de-DE');
let zeit = timestamp.toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'});

// Verbrauch berechnen
let verbrauch = (liter / km * 100).toFixed(2);

// --- Logging in Notizdatei bei neuer Berechnung
if (isNew) {
  let logEntry = `${datum} ${zeit} | ${liter} l ${km} km | ${verbrauch} l | ${preis} €/l\n`;
  let oldLog = fm.fileExists(logFile) ? fm.readString(logFile) : "";
  fm.writeString(logFile, oldLog + logEntry);
  if (fm.isFileStoredIniCloud(logFile)) fm.downloadFileFromiCloud(logFile);
}

// --- Widget Layout ---
let widget = new ListWidget();
widget.setPadding(10,10,10,10);

let gradient = new LinearGradient();
gradient.locations = [0, 1];
gradient.colors = [
  new Color("#43cea2"),
  new Color("#185a9d")
];
widget.backgroundGradient = gradient;

// Großes Tankstellen-Icon oben
let icon = widget.addText("⛽️");
icon.centerAlignText();
icon.font = Font.heavySystemFont(34);      // Korrigiert: Größe als Zahl!
icon.textColor = Color.white();
widget.addSpacer(8);

// Verbrauch groß
let value = widget.addText(`${verbrauch} l`);
value.centerAlignText();
value.font = Font.semiboldSystemFont(28);  // Korrigiert: Größe als Zahl!
value.textColor = Color.white();

// Benzinpreis direkt und deutlich darunter
widget.addSpacer(4);
let priceText = widget.addText(`Preis: ${preis} €/l`);
priceText.centerAlignText();
priceText.font = Font.semiboldSystemFont(16);  // Korrigiert: Größe als Zahl!
priceText.textColor = Color.white();

widget.addSpacer(6);
let footer = widget.addText(`${datum} ${zeit}`);
footer.centerAlignText();
footer.font = Font.mediumSystemFont(14);   // Korrigiert: Größe als Zahl!
footer.textColor = Color.lightGray();

if (config.runsInApp) {
  widget.presentSmall();
} else {
  Script.setWidget(widget);
  Script.complete();
}
