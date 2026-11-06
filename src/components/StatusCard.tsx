import React, { type ReactElement, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import type { Tone } from '../types/presence';
import { toneColor } from './toneColor';
import { toneSurface, toneTitleColor } from './toneStyles';

interface StatusCardProps {
  title: string;
  subtitle: string;
  tone: Tone;
  trailing?: ReactNode;
}

export function StatusCard({ title, subtitle, tone, trailing }: StatusCardProps): ReactElement {
  const accent = toneColor(tone);
  return (
    <View
      accessible
      accessibilityLabel={`${title}: ${subtitle}`}
      style={[styles.card, toneSurface(tone)]}
    >
      <View style={[styles.badge, { borderColor: accent }]}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
      </View>
      <View style={styles.texts}>
        <Text style={[styles.title, { color: toneTitleColor(tone) }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: tone === 'ok' ? accent : colors.muted }]}>
          {subtitle}
        </Text>
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 64,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.bodyStrong,
  },
  subtitle: {
    ...typography.caption,
  },
});
