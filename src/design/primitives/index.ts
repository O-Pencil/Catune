/**
 * @file index.ts
 * @description primitives 桶文件：移动端基础组件统一入口。
 *
 * [WHO] 导出 Card / Button / IconButton / Badge / Chip / SegmentedControl / Field / SwitchRow / ListItem / Section / ProgressBar / Stack
 * [FROM] 依赖同目录基础组件
 * [TO] 被 src/design screens/components 作为设计系统 primitives 入口
 * [HERE] src/design/primitives/index.ts · 基础组件统一导出
 */
export {Card} from './Card';
export {Button, type ButtonSize, type ButtonVariant} from './Button';
export {IconButton} from './IconButton';
export {Badge, type BadgeTone} from './Badge';
export {Chip} from './Chip';
export {SegmentedControl, type SegmentedOption} from './SegmentedControl';
export {Field} from './Field';
export {SwitchRow} from './SwitchRow';
export {ListItem} from './ListItem';
export {Section} from './Section';
export {ProgressBar} from './ProgressBar';
export {Stack, Inline} from './Stack';
