/** BNO08x 协议使用的单位四元数，顺序与 17 字节 BLE 包一致。 */
export type Quaternion = {w: number; x: number; y: number; z: number};

const RAD2DEG = 180 / Math.PI;

function normalize(q: Quaternion): Quaternion {
  const norm = Math.hypot(q.w, q.x, q.y, q.z);
  if (!Number.isFinite(norm) || norm < 1e-6) {
    return {w: 1, x: 0, y: 0, z: 0};
  }
  return {w: q.w / norm, x: q.x / norm, y: q.y / norm, z: q.z / norm};
}

function conjugate(q: Quaternion): Quaternion {
  return {w: q.w, x: -q.x, y: -q.y, z: -q.z};
}

function multiply(a: Quaternion, b: Quaternion): Quaternion {
  return {
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  };
}

/**
 * 当前姿态相对坐直基线的 pitch/roll。
 *
 * 先做 qRelative = inverse(qBaseline) × qCurrent，再转欧拉角；这样不会把
 * 两个绝对欧拉角直接相减，也就避开 ±180° 跳变，并把输出轴固定在校准坐标系。
 */
export function relativePitchRoll(
  baseline: Quaternion,
  current: Quaternion,
): {pitch: number; roll: number} {
  const base = normalize(baseline);
  const now = normalize(current);
  const q = normalize(multiply(conjugate(base), now));

  const roll = Math.atan2(2 * (q.w * q.x + q.y * q.z), 1 - 2 * (q.x * q.x + q.y * q.y)) * RAD2DEG;
  const sinp = Math.max(-1, Math.min(1, 2 * (q.w * q.y - q.z * q.x)));
  const pitch = Math.asin(sinp) * RAD2DEG;
  return {pitch, roll};
}
