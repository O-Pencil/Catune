/**
 * NativeWind 全局类型补丁
 *
 * 背景：@rn-primitives/* + react-native-reanimated 都基于 React Native 的
 *      ViewProps/PressableProps/TextProps/ImageProps，但这些类型本身不包含
 *      className 字段（运行时由 cssInterop 注入）。
 *
 * 解法：通过 TypeScript module augmentation，给 RN 内置类型补 className，
 *       让所有衍生类型自动继承 className。
 */
import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface PressableProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
    placeholderClassName?: string;
  }
}

// react-native-reanimated 的 Animated.View 也需要 className 支持
declare module 'react-native-reanimated' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface AnimatedProps<_P> {
    className?: string;
  }
}