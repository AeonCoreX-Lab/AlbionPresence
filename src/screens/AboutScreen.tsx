import React, { type ReactElement } from 'react';
import { Image, ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { colors, spacing, typography } from '../theme';

const logo = require('../../assets/branding/albionpresence-logo.png');

export function AboutScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl }]}
    >
      <Image source={logo} style={styles.logo} resizeMode="contain" accessibilityLabel="AlbionPresence logo" />
      <Text style={styles.title} accessibilityRole="header">
        AlbionPresence
      </Text>
      <Text style={styles.tagline}>PLAY • TRACK • SHARE</Text>

      <Card title="Independent project">
        <Text style={styles.body}>
          AlbionPresence is an open-source community project. It is not affiliated with or endorsed by Sandbox
          Interactive or Discord.
        </Text>
      </Card>
      <Card title="Privacy">
        <Text style={styles.body}>
          No analytics or telemetry. The app only looks at whether the configured Albion Online package is in the
          foreground, and it cannot tell whether you are logged in. See PRIVACY.md in the repository.
        </Text>
      </Card>
      <Card title="Licences">
        <Text style={styles.body}>
          Source code: MIT. The logo is not covered by the MIT licence. The Discord Social SDK is proprietary and
          governed by Discord's terms. See LICENSE and THIRD_PARTY_NOTICES.md.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.lg, alignItems: 'stretch' },
  logo: { width: 120, height: 120, alignSelf: 'center' },
  title: { ...typography.title, color: colors.ivory, textAlign: 'center' },
  tagline: { ...typography.caption, color: colors.gold, textAlign: 'center', letterSpacing: 2 },
  body: { ...typography.body, color: colors.ivoryMuted },
});
