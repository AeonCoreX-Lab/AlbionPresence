import React, { type ReactElement } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

const logo = require('../../assets/branding/albionpresence-logo.png');

/** Shown only while the app waits for the native layer to report its state. */
export function SplashScreen(): ReactElement {
  return (
    <View style={styles.root}>
      <Image
        source={logo}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="AlbionPresence logo"
        accessibilityIgnoresInvertColors
      />
      <ActivityIndicator color={colors.violetSoft} size="large" />
      <Text style={styles.text}>Initializing…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  logo: {
    width: 280,
    height: 280,
  },
  text: {
    ...typography.body,
    color: colors.ivoryMuted,
  },
});
