import {Quaternion, relativePitchRoll} from '../orientationMath';

const deg = (value: number) => (value * Math.PI) / 180;

function multiply(a: Quaternion, b: Quaternion): Quaternion {
  return {
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  };
}

const axisX = (angleDeg: number): Quaternion => ({
  w: Math.cos(deg(angleDeg) / 2),
  x: Math.sin(deg(angleDeg) / 2),
  y: 0,
  z: 0,
});

const axisY = (angleDeg: number): Quaternion => ({
  w: Math.cos(deg(angleDeg) / 2),
  x: 0,
  y: Math.sin(deg(angleDeg) / 2),
  z: 0,
});

describe('relativePitchRoll', () => {
  const identity = {w: 1, x: 0, y: 0, z: 0};

  it('returns zero at the calibrated orientation', () => {
    const baseline = multiply(axisX(172), axisY(38));
    expect(relativePitchRoll(baseline, baseline)).toEqual({pitch: 0, roll: 0});
  });

  it('measures forward pitch in the calibrated coordinate frame', () => {
    const baseline = multiply(axisX(172), axisY(38));
    const current = multiply(baseline, axisY(20));
    const result = relativePitchRoll(baseline, current);
    expect(result.pitch).toBeCloseTo(20, 5);
    expect(result.roll).toBeCloseTo(0, 5);
  });

  it('measures side roll without wrapping across absolute ±180 degrees', () => {
    const baseline = axisX(175);
    const current = multiply(baseline, axisX(15));
    const result = relativePitchRoll(baseline, current);
    expect(result.roll).toBeCloseTo(15, 5);
    expect(result.pitch).toBeCloseTo(0, 5);
  });

  it('treats q and -q as the same physical orientation', () => {
    const current = axisY(25);
    const negated = {w: -current.w, x: -current.x, y: -current.y, z: -current.z};
    expect(relativePitchRoll(identity, negated).pitch).toBeCloseTo(25, 5);
  });
});
