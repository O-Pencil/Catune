/**
 * Primitives barrel：react-native-reusables 组件库统一入口 + Catune 老 API 兼容层。
 *
 * - 上面 export * from './xxx' 是 reusables 32 个组件
 * - 下面从 './compat' 导出 Catune 老 API（Button/Chip/Field/SegmentedControl），
 *   内部包装到 reusables，screen 暂时不需要改 import。
 */
export * from './accordion';
export * from './alert';
export * from './alert-dialog';
export * from './aspect-ratio';
export * from './avatar';
export * from './badge';
export * from './button';
export * from './card';
export * from './checkbox';
export * from './collapsible';
export * from './context-menu';
export * from './dialog';
export * from './dropdown-menu';
export * from './hover-card';
export * from './icon';
export * from './input';
export * from './label';
export * from './menubar';
export * from './native-only-animated-view';
export * from './popover';
export * from './progress';
export * from './radio-group';
export * from './select';
export * from './separator';
export * from './skeleton';
export * from './switch';
export * from './tabs';
export * from './text';
export * from './textarea';
export * from './toggle';
export * from './toggle-group';
export * from './tooltip';

// Catune 老 API 兼容层（运行时映射到 reusables）
// 不从 barrel export Button 避免覆盖 reusables 原生 Button
// 老 screen 直接从 '@/design/primitives/compat' import 旧 API
export * from './button';
export {Chip, Field, SegmentedControl} from './compat';