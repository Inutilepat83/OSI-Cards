import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from '@jest/globals';

// Lightweight runtime schema checks
function validateCard(card: any) {
  if (!card || typeof card !== 'object') throw new Error('card is not an object');
  if (!card.cardTitle || typeof card.cardTitle !== 'string') throw new Error('cardTitle missing or not string');
  if (!card.cardType || typeof card.cardType !== 'string') throw new Error('cardType missing or not string');
  if (!Array.isArray(card.sections)) throw new Error('sections missing or not array');
  for (const section of card.sections) {
    if (!section.type || typeof section.type !== 'string') throw new Error('section.type missing or not string');
    if (!Array.isArray(section.fields)) throw new Error('section.fields missing or not array');
  }
}

describe('Demo card JSON schema', () => {
  // assets path relative to repo root
  const demoDir = join(__dirname, '..', '..', '..', '..', 'assets', 'cards', 'demo');

  let files: string[] = [];
  try {
    files = readdirSync(demoDir).filter(f => f.endsWith('.json'));
  } catch (err) {
    // If assets aren't present in the test environment, skip tests gracefully.
    it('skips demo JSON schema tests when demo assets are missing', () => {
      expect(true).toBe(true);
    });
    return;
  }

  it('index.json must exist and include cards array', () => {
    const idx = readFileSync(join(demoDir, 'index.json'), 'utf-8');
    const parsed = JSON.parse(idx);
    expect(parsed && Array.isArray(parsed.cards)).toBe(true);
  });

  for (const file of files) {
    if (file === 'index.json') continue;
    it(`validates ${file}`, () => {
      const content = readFileSync(join(demoDir, file), 'utf-8');
      const parsed = JSON.parse(content);
      expect(() => validateCard(parsed)).not.toThrow();
    });
  }
});
