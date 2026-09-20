import { describe, expect, it } from 'vitest';
import { calculateBodyFat, computeBodyComposition } from './bodyComposition';
import { Measurement } from '@/types';

const measurement = new Measurement({
  id: 'measurement-1',
  weight: 82.5,
  waist: 90,
  neck: 40,
  timestamp: '2026-01-01T12:00:00.000Z',
});

describe('calculateBodyFat', () => {
  it('applies the US Navy formula for men', () => {
    expect(calculateBodyFat('male', 181, 90, 40)).toBeCloseTo(18.2, 1);
  });

  it('applies the simplified US Navy formula for women', () => {
    expect(calculateBodyFat('female', 165, 100, 32)).toBeCloseTo(4.1, 1);
  });
});

describe('computeBodyComposition', () => {
  const profile = { height: 181, gender: 'male' };

  it('returns null when there is no profile', () => {
    expect(computeBodyComposition(null, measurement)).toBeNull();
  });

  it('returns null when there is no measurement', () => {
    expect(computeBodyComposition(profile, undefined)).toBeNull();
  });

  it('returns null when the profile has no height', () => {
    expect(computeBodyComposition({ height: null, gender: 'male' }, measurement)).toBeNull();
  });

  it('returns null when waist is not greater than neck', () => {
    const invalid = new Measurement({ id: 'm', weight: 82.5, waist: 35, neck: 40, timestamp: '2026-01-01T12:00:00.000Z' });
    expect(computeBodyComposition(profile, invalid)).toBeNull();
  });

  it('returns null when weight, waist or neck is missing', () => {
    const partial = new Measurement({ id: 'm', weight: null, waist: 90, neck: 40, timestamp: '2026-01-01T12:00:00.000Z' });
    expect(computeBodyComposition(profile, partial)).toBeNull();
  });

  it('computes body fat %, fat mass and lean mass when all inputs are present', () => {
    const result = computeBodyComposition(profile, measurement);

    expect(result).not.toBeNull();
    expect(result!.bodyFatPercentage).toBeCloseTo(18.2, 1);
    expect(result!.fatMass + result!.leanMass).toBeCloseTo(82.5, 5);
  });
});
