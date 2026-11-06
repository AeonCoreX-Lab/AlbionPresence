import React, { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';

interface ComingSoonScreenProps {
  title: string;
  phase: string;
  description: string;
}

/** Honest placeholder for screens that are designed but not built yet. */
export function ComingSoonScreen({ title, phase, description }: ComingSoonScreenProps): ReactElement {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.xl }]}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.phase}>Not built yet · planned for {phase}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.ivory,
  },
  phase: {
    ...typography.caption,
    color: colors.warning,
  },
  description: {
    ...typography.body,
    color: colors.ivoryMuted,
  },
});
