/**
 * @file LaunchScreen.tsx
 * @description 欢迎启动页：Aurora 呼吸绿光 + LOGO-2 + 引导文案 + Get Start!
 */
import React from 'react';
import {Image, Pressable, SafeAreaView, StyleSheet, Text, View} from 'react-native';

import {APP_NAME} from '../../constants/appMeta';
import {Aurora} from '../components/aurora/Aurora';
import {theme} from '../theme';
import {useT} from '../i18n';

const LAUNCH_LOGO = require('../../../public/logo/LOGO-2.png');

type Props = {
  onStart: () => void;
};

export function LaunchScreen({onStart}: Props): React.JSX.Element {
  const t = useT();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.auroraWrap}>
        <Aurora />
      </View>
      <View style={styles.content}>
        <Image source={LAUNCH_LOGO} style={styles.logo} resizeMode="contain" accessibilityLabel="CATUNE logo" />
        <Text style={styles.brand}>{APP_NAME}</Text>
        <Text style={styles.tagline}>{t('launch.tagline')}</Text>
      </View>
      <View style={styles.footer}>
        <Pressable
          style={({pressed}) => [styles.cta, pressed && styles.ctaPressed]}
          onPress={onStart}
          accessibilityRole="button"
          accessibilityLabel={t('launch.cta')}>
          <Text style={styles.ctaText}>{t('launch.cta')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  auroraWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '52%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.xxxl,
  },
  logo: {
    width: 132,
    height: 132,
    borderRadius: 32,
    marginBottom: theme.spacing.xl,
  },
  brand: {
    color: theme.colors.textPrimary,
    fontSize: 34,
    fontFamily: theme.font.displayBold,
    letterSpacing: 1.5,
    marginBottom: theme.spacing.lg,
  },
  tagline: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    fontFamily: 'Quicksand_600SemiBold',
    maxWidth: 300,
  },
  footer: {
    paddingHorizontal: theme.spacing.xxl,
    paddingBottom: theme.spacing.xxl,
  },
  cta: {
    backgroundColor: '#141414',
    borderRadius: theme.radius.pill,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPressed: {
    opacity: 0.88,
    transform: [{scale: 0.99}],
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Quicksand_700Bold',
    letterSpacing: 0.2,
  },
});
