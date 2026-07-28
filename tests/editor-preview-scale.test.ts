import { describe, it, expect } from 'vitest';
import { computeDeviceScale } from '../editor/public/app.js';

describe('computeDeviceScale', () => {
  it('shrinks to fit when the panel is narrower than the intrinsic width', () => {
    expect(computeDeviceScale(500, 1280)).toBeCloseTo(500 / 1280);
  });

  it('caps the scale at 1 when the panel is wider than the intrinsic width', () => {
    expect(computeDeviceScale(2000, 1280)).toBe(1);
  });

  it('recalculates as the panel width changes', () => {
    expect(computeDeviceScale(800, 1280)).toBeCloseTo(800 / 1280);
  });

  it('returns 1 for a zero or negative panel width', () => {
    expect(computeDeviceScale(0, 1280)).toBe(1);
    expect(computeDeviceScale(-10, 1280)).toBe(1);
  });
});
