/**
 * @file catAnchors.ts
 * @description 猫脊柱传感器点位的「逐帧锚点」标定表。坐标为猫图盒子的比例 (u,v)∈[0,1]，origin 左上。
 *   因为翻页每帧猫都重新摆姿势，C7/头、T12/中背、L5/腰 的位置每帧不同 → 用关键帧 + 线性插值。
 *   关键帧数值由 DeskScreen 的校准模式（点击猫身打印 u,v + 帧号）实测后填入；下方为粗略初值，待校准。
 *
 * [WHO] 导出 `Anchor`、`SpineAnchors`、`ANCHOR_KEYFRAMES`、`anchorsAt(frameIndex, count)`
 * [FROM] 无依赖（纯数据 + 插值）
 * [TO] 被 DeskScreen 的 SensorOverlay 消费，换算成像素点位
 * [HERE] src/ui/assets/catAnchors.ts · 点位逐帧标定表
 */

export type Anchor = {u: number; v: number};
export type SpineAnchors = {c7: Anchor; t12: Anchor; l5: Anchor};

/** 关键帧（frame=0 基）。frame 之间线性插值；越多越贴合。当前为粗略初值，请用校准模式实测覆盖。 */
export const ANCHOR_KEYFRAMES: Array<{frame: number; spine: SpineAnchors}> = [
  // 帧 1：头低俯、偏左
  {frame: 0, spine: {c7: {u: 0.30, v: 0.34}, t12: {u: 0.40, v: 0.44}, l5: {u: 0.50, v: 0.60}}},
  // 帧 30：身体直起、头朝上
  {frame: 29, spine: {c7: {u: 0.58, v: 0.20}, t12: {u: 0.46, v: 0.42}, l5: {u: 0.46, v: 0.62}}},
  // 帧 60：头朝右
  {frame: 59, spine: {c7: {u: 0.66, v: 0.30}, t12: {u: 0.50, v: 0.46}, l5: {u: 0.46, v: 0.60}}},
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpAnchor(a: Anchor, b: Anchor, t: number): Anchor {
  return {u: lerp(a.u, b.u, t), v: lerp(a.v, b.v, t)};
}

function lerpSpine(a: SpineAnchors, b: SpineAnchors, t: number): SpineAnchors {
  return {
    c7: lerpAnchor(a.c7, b.c7, t),
    t12: lerpAnchor(a.t12, b.t12, t),
    l5: lerpAnchor(a.l5, b.l5, t),
  };
}

/** 取第 frameIndex 帧的脊柱锚点：落在关键帧之间则线性插值，越界则取端点。 */
export function anchorsAt(frameIndex: number): SpineAnchors {
  const keys = ANCHOR_KEYFRAMES;
  if (keys.length === 0) {
    // 兜底：竖直居中脊柱
    return {c7: {u: 0.5, v: 0.22}, t12: {u: 0.5, v: 0.45}, l5: {u: 0.5, v: 0.65}};
  }
  if (frameIndex <= keys[0].frame) {
    return keys[0].spine;
  }
  const last = keys[keys.length - 1];
  if (frameIndex >= last.frame) {
    return last.spine;
  }
  for (let i = 0; i < keys.length - 1; i += 1) {
    const lo = keys[i];
    const hi = keys[i + 1];
    if (frameIndex >= lo.frame && frameIndex <= hi.frame) {
      const span = hi.frame - lo.frame || 1;
      const t = (frameIndex - lo.frame) / span;
      return lerpSpine(lo.spine, hi.spine, t);
    }
  }
  return last.spine;
}
