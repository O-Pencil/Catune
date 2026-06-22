/**
 * @file AppLogo.tsx
 * @description CATUNE 品牌 Logo（三端通用，源自 public/logo/LOGO.png）。
 */
import React from 'react';
import {Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle} from 'react-native';

const LOGO_SOURCE = require('../../../public/logo/LOGO.png');

type Props = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

export function AppLogo({size = 48, style, imageStyle}: Props): React.JSX.Element {
  const radius = Math.round(size * 0.24);
  return (
    <View style={[styles.wrap, {width: size, height: size, borderRadius: radius}, style]}>
      <Image
        source={LOGO_SOURCE}
        style={[{width: size, height: size, borderRadius: radius}, imageStyle]}
        resizeMode="cover"
        accessibilityLabel="CATUNE logo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
});
