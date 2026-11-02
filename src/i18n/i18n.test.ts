import { describe, expect, it } from 'vitest';
import { translate } from './index';
import de from './de.json';
import en from './en.json';
import tr from './tr.json';

describe('translate', () => {
  it('setzt Variablen ein und lässt unbekannte Platzhalter stehen', () => {
    expect(translate('en', 'fixed.transferDone', { amount: '5,00 €', name: 'Notgroschen' })).toContain('Notgroschen');
    expect(translate('de', 'warn.overdraft', { date: '01.12.2026' })).toContain('{balance}');
  });

  it('fällt auf Deutsch und dann auf den Schlüssel zurück', () => {
    expect(translate('tr', 'nav.fixed')).toBe('Sabit giderler');
    expect(translate('en', 'does.not.exist')).toBe('does.not.exist');
  });

  it('hat in allen Sprachen dieselben Schlüssel', () => {
    const keys = Object.keys(de).sort();
    expect(Object.keys(en).sort()).toEqual(keys);
    expect(Object.keys(tr).sort()).toEqual(keys);
  });
});
