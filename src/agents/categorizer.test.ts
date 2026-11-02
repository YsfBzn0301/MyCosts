import { describe, expect, it } from 'vitest';
import { categorizeByRules } from './categorizer';

describe('categorizeByRules', () => {
  it.each([
    ['Haftpflichtversicherung', 'insurance'],
    ['Kaltmiete', 'housing'],
    ['Netflix', 'subscriptions'],
    ['Vodafone Glasfaser', 'telecom'],
    ['Deutschlandticket', 'mobility'],
    ['Bausparvertrag', 'finance'],
  ])('ordnet "%s" → %s zu', (name, expected) => {
    expect(categorizeByRules(name)).toBe(expected);
  });

  it('liefert null bei unbekannten Namen (Fall für Haiku)', () => {
    expect(categorizeByRules('Zeitschrift Foo')).toBeNull();
  });
});
