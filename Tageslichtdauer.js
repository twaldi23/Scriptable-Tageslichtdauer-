// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: magic;
// Sonnenaufgang/-untergang mit zuverlässigem Algorithmus (SunCalc-Ansatz)// 
// Perplexcity 19.8.25
function toRadians(deg) { return deg * Math.PI / 180; }
function toDegrees(rad) { return rad * 180 / Math.PI; }

// Hilfsfunktion für Zeiten (UTC-Stunde als js Date im lokalen TZ)
function createLocalTime(date, hour) {
  let h = Math.floor(hour);
  let m = Math.round((hour - h) * 60);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0);
}

// Hauptfunktion: Rückgabe Sonnenaufgang und -untergang als Dezimalzeit
function getSunriseSunset(date, latitude, longitude) {
    // Tage seit J2000.0
    let n = Math.floor((date - new Date(date.getFullYear(),0,0)) / 86400000);

    // Berechnungen (siehe NOAA oder Wikipedia Astronomical Algorithms)
    let lngHour = longitude / 15;

    // Sonnenaufgang
    let t_rise = n + ((6 - lngHour) / 24);
    let M_rise = (0.9856 * t_rise) - 3.289;
    let L_rise = M_rise + (1.916 * Math.sin(toRadians(M_rise))) + (0.020 * Math.sin(2 * toRadians(M_rise))) + 282.634;
    L_rise = (L_rise + 360) % 360;
    let RA_rise = toDegrees(Math.atan(0.91764 * Math.tan(toRadians(L_rise))));
    RA_rise = (RA_rise + 360) % 360;
    let Lquadrant_rise  = (Math.floor( L_rise/90)) * 90;
    let RAquadrant_rise = (Math.floor(RA_rise/90)) * 90;
    RA_rise = RA_rise + (Lquadrant_rise - RAquadrant_rise);
    RA_rise = RA_rise / 15;
    let sinDec_rise = 0.39782 * Math.sin(toRadians(L_rise));
    let cosDec_rise = Math.cos(Math.asin(sinDec_rise));
    let cosH_rise = (Math.cos(toRadians(90.833)) - (sinDec_rise * Math.sin(toRadians(latitude)))) / (cosDec_rise * Math.cos(toRadians(latitude)));
    // Prüfen auf Polarnacht/-tag
    if (cosH_rise > 1 || cosH_rise < -1) return [null, null];
    let H_rise = 360 - toDegrees(Math.acos(cosH_rise));
    H_rise = H_rise / 15;
    let T_rise = H_rise + RA_rise - (0.06571 * t_rise) - 6.622;
    let utc_rise = (T_rise - lngHour) % 24;

    // Sonnenuntergang
    let t_set = n + ((18 - lngHour) / 24);
    let M_set = (0.9856 * t_set) - 3.289;
    let L_set = M_set + (1.916 * Math.sin(toRadians(M_set))) + (0.020 * Math.sin(2 * toRadians(M_set))) + 282.634;
    L_set = (L_set + 360) % 360;
    let RA_set = toDegrees(Math.atan(0.91764 * Math.tan(toRadians(L_set))));
    RA_set = (RA_set + 360) % 360;
    let Lquadrant_set  = (Math.floor( L_set/90)) * 90;
    let RAquadrant_set = (Math.floor(RA_set/90)) * 90;
    RA_set = RA_set + (Lquadrant_set - RAquadrant_set);
    RA_set = RA_set / 15;
    let sinDec_set = 0.39782 * Math.sin(toRadians(L_set));
    let cosDec_set = Math.cos(Math.asin(sinDec_set));
    let cosH_set = (Math.cos(toRadians(90.833)) - (sinDec_set * Math.sin(toRadians(latitude)))) / (cosDec_set * Math.cos(toRadians(latitude)));
    if (cosH_set > 1 || cosH_set < -1) return [null, null];
    let H_set = toDegrees(Math.acos(cosH_set));
    H_set = H_set / 15;
    let T_set = H_set + RA_set - (0.06571 * t_set) - 6.622;
    let utc_set = (T_set - lngHour) % 24;

    return [utc_rise, utc_set];
}

// Standort holen
let loc = await Location.current();
let lat = loc.latitude;
let lon = loc.longitude;
let tzOffset = -new Date().getTimezoneOffset() / 60;

let today = new Date();
let [utcRise, utcSet] = getSunriseSunset(today, lat, lon);

// Prüfen auf Polartag/Nacht
let sunrise, sunset;
let valid = (utcRise != null && utcSet != null);
if (valid) {
  sunrise = createLocalTime(today, (utcRise + tzOffset + 24) % 24);
  sunset = createLocalTime(today, (utcSet + tzOffset + 24) % 24);
} else {
  sunrise = null;
  sunset = null;
}

// Tageslichtdauer berechnen
let daylightString = '-';
if (sunrise && sunset) {
  const daylightMillis = sunset.getTime() - sunrise.getTime();
  const daylightHours = Math.floor(daylightMillis / 3600000);
  const daylightMinutes = Math.floor((daylightMillis % 3600000) / 60000);
  daylightString = `${daylightHours}h ${daylightMinutes}min`;
}

// Widget bauen
let widget = new ListWidget();
widget.backgroundColor = new Color("#222222");

let title = widget.addText("Sonnenzeiten");
title.font = Font.boldSystemFont(18);
title.textColor = Color.yellow();

widget.addSpacer(8);

let sunriseStr = sunrise ? `${sunrise.getHours().toString().padStart(2, '0')}:${sunrise.getMinutes().toString().padStart(2, '0')}` : '—';
let sunsetStr = sunset ? `${sunset.getHours().toString().padStart(2, '0')}:${sunset.getMinutes().toString().padStart(2, '0')}` : '—';

let sunriseText = widget.addText(`🌅 Sonnenaufgang: ${sunriseStr}`);
sunriseText.textColor = Color.white();
let sunsetText = widget.addText(`🌇 Sonnenuntergang: ${sunsetStr}`);
sunsetText.textColor = Color.white();

widget.addSpacer(8);
let daylightText = widget.addText(`🌞 Tageslichtdauer: ${daylightString}`);
daylightText.textColor = Color.yellow();

widget.addSpacer(8);
let locText = widget.addText(`📍 Lat: ${lat.toFixed(3)} Lon: ${lon.toFixed(3)} | TZ: UTC${tzOffset>=0?'+':''}${tzOffset}`);
locText.textColor = Color.gray();

Script.setWidget(widget);
Script.complete();
