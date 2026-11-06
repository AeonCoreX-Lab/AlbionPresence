import React, { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import type { Tone } from '../types/presence';
import { toneTitleColor } from './toneStyles';

interface InfoRowProps {
  label: string;
  value: string;
  tone?: Tone;
}

export function InfoRow({ label, value, tone = 'muted' }: InfoRowProps): ReactElement {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: toneTitleColor(tone) }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.ivoryMuted,
  },
  value: {
    ...typography.bodyStrong,
    flexShrink: 1,
    textAlign: 'right',
  },
});
