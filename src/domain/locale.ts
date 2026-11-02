// Aktives Format für Zahlen und Datum. Wird vom i18n-Provider gesetzt.
let current = 'de-DE';
const numberFormats = new Map<string, Intl.NumberFormat>();
const dateFormats = new Map<string, Intl.DateTimeFormat>();

export function setLocale(locale: string): void {
  current = locale;
}

export function getLocale(): string {
  return current;
}

export function eurFormat(): Intl.NumberFormat {
  let f = numberFormats.get(current);
  if (!f) {
    f = new Intl.NumberFormat(current, { style: 'currency', currency: 'EUR' });
    numberFormats.set(current, f);
  }
  return f;
}

export function dateFormat(): Intl.DateTimeFormat {
  let f = dateFormats.get(current);
  if (!f) {
    f = new Intl.DateTimeFormat(current, { day: '2-digit', month: '2-digit', year: 'numeric' });
    dateFormats.set(current, f);
  }
  return f;
}
