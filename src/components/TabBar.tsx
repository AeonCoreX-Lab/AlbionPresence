import React, { type ComponentType, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';
import { HomeIcon, InfoIcon, PreviewIcon, SlidersIcon, type IconProps } from './Icons';

export type TabKey = 'home' | 'preview' | 'settings' | 'about';

const TABS: ReadonlyArray<{ key: TabKey; label: string; Icon: ComponentType<IconProps> }> = [
  { key: 'home', label: 'Home', Icon: HomeIcon },
  { key: 'preview', label: 'Preview', Icon: PreviewIcon },
  { key: 'settings', label: 'Settings', Icon: SlidersIcon },
  { key: 'about', label: 'About', Icon: InfoIcon },
];

interface TabBarProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

export function TabBar({ active, onChange }: TabBarProps): ReactElement {
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}
    >
      {TABS.map(({ key, label, Icon }) => {
        const selected = key === active;
        const color = selected ? colors.violetSoft : colors.muted;
        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            onPress={() => onChange(key)}
            style={styles.tab}
          >
            <Icon color={color} />
            <Text style={[styles.label, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundRaised,
    borderTopColor: colors.surfaceBorder,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    ...typography.caption,
  },
});
