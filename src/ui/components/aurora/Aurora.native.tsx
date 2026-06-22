/**
 * @file Aurora.native.tsx
 * @description 原生端 Aurora 近似：绿色光晕呼吸动画（无 WebGL 时的降级方案）。
 */
import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, View, ViewStyle} from 'react-native';

type Props = {
  style?: ViewStyle;
};

export function Aurora({style}: Props): React.JSX.Element {
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {toValue: 1, duration: 2800, useNativeDriver: true}),
        Animated.timing(breathe, {toValue: 0, duration: 2800, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  const opacity = breathe.interpolate({inputRange: [0, 1], outputRange: [0.45, 0.95]});
  const scale = breathe.interpolate({inputRange: [0, 1], outputRange: [0.92, 1.08]});

  return (
    <View style={[styles.host, style]} pointerEvents="none">
      <Animated.View style={[styles.glowMain, {opacity, transform: [{scale}]}]} />
      <Animated.View
        style={[
          styles.glowSoft,
          {
            opacity: breathe.interpolate({inputRange: [0, 1], outputRange: [0.25, 0.55]}),
            transform: [{scale: breathe.interpolate({inputRange: [0, 1], outputRange: [1.05, 0.95]})}],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  glowMain: {
    position: 'absolute',
    top: '-18%',
    left: '-20%',
    width: '140%',
    height: '58%',
    borderRadius: 9999,
    backgroundColor: '#7CFF67',
  },
  glowSoft: {
    position: 'absolute',
    top: '-8%',
    right: '-25%',
    width: '90%',
    height: '42%',
    borderRadius: 9999,
    backgroundColor: '#B8F58A',
  },
});
