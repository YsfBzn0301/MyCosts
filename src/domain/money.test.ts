import { describe, expect, it } from 'vitest';
import { centsToInput, monthlyCents, parseAmountToCents, yearlyCents } from './money';

describe('parseAmountToCents', () => {
  it('versteht deutsches und englisches Dezimalformat', () => {
    expect(parseAmountToCents('12,99')).toBe(1299);
    expect(parseAmountToCents('12.99')).toBe(1299);
    expect(parseAmountToCents('1.200,50')).toBe(120050);
    expect(parseAmountToCents(' 9 ')).toBe(900);
  });

  it('lehnt ungültige oder nicht positive Werte ab', () => {
    expect(parseAmountToCents('')).toBeNull();
    expect(parseAmountToCents('abc')).toBeNull();
    expect(parseAmountToCents('0')).toBeNull();
    expect(parseAmountToCents('-5')).toBeNull();
    expect(parseAmountToCents('1,234')).toBeNull();
  });
});

describe('centsToInput', () => {
  it('formatiert für das Eingabefeld', () => {
    expect(centsToInput(1299)).toBe('12,99');
    expect(centsToInput(500)).toBe('5,00');
  });
});

describe('Hochrechnung', () => {
  it('rechnet Intervalle korrekt auf Jahr und Monat hoch', () => {
    expect(yearlyCents({ amountCents: 1000, interval: 'monthly' })).toBe(12000);
    expect(yearlyCents({ amountCents: 1000, interval: 'quarterly' })).toBe(4000);
    expect(yearlyCents({ amountCents: 1000, interval: 'yearly' })).toBe(1000);
    expect(monthlyCents({ amountCents: 1000, interval: 'yearly' })).toBe(83);
    expect(monthlyCents({ amountCents: 1000, interval: 'quarterly' })).toBe(333);
  });
});
