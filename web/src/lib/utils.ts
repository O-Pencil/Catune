/**
 * [WHO]: 导出 cn（Tailwind 类名合并工具）
 * [FROM]: clsx (clsx/ClassValue), tailwind-merge (twMerge)
 * [TO]: 被 19 个组件文件消费（haptic/*, icons/*, layout/*, ui/*, pages/PlantPage）
 * [HERE]: web/src/lib/utils.ts · cn() 工具函数
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
