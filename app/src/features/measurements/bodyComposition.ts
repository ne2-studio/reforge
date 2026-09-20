import type { Measurement } from '@/types';

// Client-side body composition estimate for the progress display only — never sent to, or
// received from, the backend (MeasurementDto has no body-fat/lean-mass field). Local to this
// feature, not a shared utility, same treatment as the activities feature's calorieEstimate.ts.
// Ported from the source reforge-frontend's ProgressTracker.tsx: the US Navy body-fat-%
// formula, plus the derived lean/fat mass split.
export function calculateBodyFat(gender: string, height: number, waist: number, neck: number): number {
  const logWaistMinusNeck = Math.log10(waist - neck);
  const logHeight = Math.log10(height);

  if (gender === 'male') {
    // % BF = 495 / (1.0324 - 0.19077 × log10(waist - neck) + 0.15456 × log10(height)) - 450
    const denominator = 1.0324 - 0.19077 * logWaistMinusNeck + 0.15456 * logHeight;
    return 495 / denominator - 450;
  }

  // For women (without hip), a simplified formula:
  // % BF = 163.205 × log10(waist - neck) - 97.684 × log10(height) - 78.387
  return 163.205 * logWaistMinusNeck - 97.684 * logHeight - 78.387;
}

export interface BodyComposition {
  bodyFatPercentage: number;
  leanMass: number;
  fatMass: number;
}

// Only computable when height, weight, waist and neck are all present and waist > neck — same
// guard as the source ProgressTracker.tsx. Returns null otherwise, meaning "not enough data",
// not a zero measurement.
export function computeBodyComposition(
  profile: { height: number | null; gender: string | null } | null,
  measurement: Pick<Measurement, 'weight' | 'waist' | 'neck'> | undefined
): BodyComposition | null {
  if (!profile || !measurement) return null;

  const { height, gender } = profile;
  const { weight, waist, neck } = measurement;

  if (!height || !weight || !waist || !neck || waist <= neck || !gender) return null;

  const bodyFatPercentage = calculateBodyFat(gender, height, waist, neck);
  const fatMass = (weight * bodyFatPercentage) / 100;
  const leanMass = weight - fatMass;

  return { bodyFatPercentage, leanMass, fatMass };
}
