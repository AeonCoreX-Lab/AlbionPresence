import React, { type ReactElement } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { InfoRow } from '../components/InfoRow';
import { PresencePreviewCard } from '../components/PresencePreviewCard';
import { useElapsedMs } from '../hooks/useElapsedMs';
import { usePresenceStore } from '../store/usePresenceStore';
import { colors, spacing, typography } from '../theme';
import { formatClock } from '../utils/time';

function Preview(): ReactElement {
  const elapsedMs = useElapsedMs();
  return <PresencePreviewCard elapsedLabel={`${formatClock(elapsedMs)} elapsed`} />;
}

/** Shows what the app is configured to publish. It never publishes anything itself. */
export function PreviewScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const phase = usePresenceStore((s) => s.native?.session.phase ?? 'inactive');
  const hasSession = phase !== 'inactive';

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl }]}
    >
      <Text style={styles.title} accessibilityRole="header">
        Rich Presence Preview
      </Text>
      <Text style={styles.note}>
        An approximation. Discord decides the final look, and nothing appears there unless presence is published.
      </Text>
      {hasSession ? (
        <Preview />
      ) : (
        <Text style={styles.note}>No active game-app session, so there is nothing to preview a timer for.</Text>
      )}
      <Card title="Published fields">
        <InfoRow label="Application" value="AlbionPresence" />
        <InfoRow label="Activity name" value="Albion Online" />
        <InfoRow label="Type" value="Playing" />
        <InfoRow label="Details" value="Exploring Albion" />
        <InfoRow label="State" value="Playing Albion Online" />
        <InfoRow label="Timestamp" value="Start only" />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.lg },
  title: { ...typography.title, color: colors.ivory },
  note: { ...typography.body, color: colors.ivoryMuted },
});
