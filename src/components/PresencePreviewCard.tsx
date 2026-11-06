import React, { type ReactElement } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

const logo = require('../../assets/branding/albionpresence-logo.png');

interface PresencePreviewCardProps {
  /** Elapsed text, e.g. "01:24:35 elapsed". */
  elapsedLabel: string;
}

/**
 * Approximation of the Discord activity the app publishes. Discord controls the
 * final presentation, so this is a preview, not a pixel-exact copy.
 */
export function PresencePreviewCard({ elapsedLabel }: PresencePreviewCardProps): ReactElement {
  return (
    <View style={styles.card} accessible accessibilityLabel={`Preview. Playing Albion Online. Exploring Albion. ${elapsedLabel}`}>
      <Text style={styles.kicker}>PLAYING</Text>
      <View style={styles.row}>
        <Image source={logo} style={styles.icon} accessibilityIgnoresInvertColors />
        <View style={styles.texts}>
          <Text style={styles.name}>Albion Online</Text>
          <Text style={styles.line}>Exploring Albion</Text>
          <Text style={styles.line}>Playing Albion Online</Text>
          <Text style={styles.elapsed}>{elapsedLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.surfaceBorder,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
    alignSelf: 'stretch',
  },
  kicker: {
    ...typography.caption,
    color: colors.muted,
    letterSpacing: 1.2,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.ivory,
  },
  line: {
    ...typography.caption,
    color: colors.ivoryMuted,
  },
  elapsed: {
    ...typography.caption,
    color: colors.ok,
  },
});
