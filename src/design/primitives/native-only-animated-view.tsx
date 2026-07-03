// @ts-nocheck
import { Platform, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * This component is used to wrap animated views that should only be animated on native.
 */
type AnimatedViewProps = React.ComponentProps<typeof Animated.View> & {as?: 'View'};
type AnimatedPressableProps = React.ComponentProps<typeof AnimatedPressable> & {as: 'Pressable'};

function NativeOnlyAnimatedView(
  props: AnimatedViewProps | AnimatedPressableProps,
) {
  const {children} = props as {children?: React.ReactNode};
  if (Platform.OS === 'web') {
    return <>{children as React.ReactNode}</>;
  } else {
    if ((props as AnimatedPressableProps).as === 'Pressable') {
      return <AnimatedPressable {...(props as AnimatedPressableProps)} />;
    }
    return <Animated.View {...(props as AnimatedViewProps)} />;
  }
}

export {NativeOnlyAnimatedView};