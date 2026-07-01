/**
 * @file types.ts
 * @description i18n 核心类型。Locale 是受控枚举，Dict 是平铺 key→string 表。
 *
 * [WHO] 导出 `Locale` / `Dict` / `TVars`
 * [FROM] 无
 * [TO] 被 ./en ./zh ./t ./LocaleContext 消费
 * [HERE] src/design/i18n/types.ts · i18n 类型定义
 */

export type Locale = 'en' | 'zh';

/** 单语字典。key 命名：'<screen>.<element>[.<sub>]'，例 `desk.feedback.tech_neck`。 */
export type Dict = Record<string, string>;

/** 模板变量。value 必须可被 String() 接受。 */
export type TVars = Record<string, string | number>;
