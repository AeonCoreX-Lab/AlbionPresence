import React, { useCallback, type ReactElement } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { CheckIcon, ClockIcon, SlidersIcon } from '../components/Icons';
import { InfoRow } from '../components/InfoRow';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatusCard } from '../components/StatusCard';
import { ToggleRow } from '../components/ToggleRow';
import { useElapsedMs } from '../hooks/useElapsedMs';
import { useNow } from '../hooks/useNow';
import { getNativeApi } from '../services/native';
import { usePresenceStore } from '../store/usePresenceStore';
import { colors, radius, spacing, typography } from '../theme';
import type { StatusDescription } from '../types/presence';
import { describeDetection, describeDiscord, describePublishing } from '../utils/status';
import { formatClock, formatRelativeTime } from '../utils/time';

const logo = require('../../assets/branding/albionpresence-logo.png');

const CHECKING: StatusDescription = { label: 'Checking…', tone: 'muted' };

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

/** Only this component re-renders every second. */
function SessionDuration(): ReactElement {
  const elapsedMs = useElapsedMs();
  return (
    <Text style={styles.timer} accessibilityRole="timer">
      {formatClock(elapsedMs)}
    </Text>
  );
}

function LastSync(): ReactElement {
  const lastPublishedAtMs = usePresenceStore((s) => s.native?.lastPublishedAtMs ?? null);
  const now = useNow(30_000, lastPublishedAtMs !== null);
  return <InfoRow label="Last synchronised" value={formatRelativeTime(lastPublishedAtMs, now)} />;
}

interface DashboardScreenProps {
  onOpenSettings: () => void;
}

export function DashboardScreen({ onOpenSettings }: DashboardScreenProps): ReactElement {
  const insets = useSafeAreaInsets();
  const nativeStatus = usePresenceStore((s) => s.nativeStatus);
  const native = usePresenceStore((s) => s.native);
  const lastError = usePresenceStore((s) => s.lastError);
  const setError = usePresenceStore((s) => s.setError);

  const available = nativeStatus === 'available';
  const detection = nativeStatus === 'checking' ? CHECKING : describeDetection(native, available);
  const discord = nativeStatus === 'checking' ? CHECKING : describeDiscord(native, available);
  const publishing = describePublishing(native, available);

  const phase = native?.session.phase ?? 'inactive';
  const sessionCaption =
    phase === 'active'
      ? 'Playing Albion Online'
      : phase === 'grace'
        ? 'Albion Online is in the background'
        : 'No active session';

  const permissionMissing = native !== null && !native.usagePermissionGranted;

  const onToggleDetection = useCallback(
    async (next: boolean) => {
      const api = getNativeApi();
      if (api === null) {
        return;
      }
      try {
        if (next) {
          if (!(await api.checkUsagePermission())) {
            // Usage Access is granted in system settings; the state refreshes
            // when the user comes back to the app.
            await api.requestUsagePermission();
            return;
          }
          await api.startMonitoring();
        } else {
          await api.stopMonitoring();
        }
      } catch (error) {
        setError(messageOf(error));
      }
    },
    [setError],
  );

  const onRequestPermission = useCallback(async () => {
    try {
      await getNativeApi()?.requestUsagePermission();
    } catch (error) {
      setError(messageOf(error));
    }
  }, [setError]);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
    >
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Image
          source={logo}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="AlbionPresence logo"
          accessibilityIgnoresInvertColors
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          onPress={onOpenSettings}
          style={styles.settingsButton}
        >
          <SlidersIcon color={colors.violetSoft} />
        </Pressable>
      </View>

      {lastError !== null ? (
        <View style={styles.errorBanner} accessibilityRole="alert">
          <Text style={styles.errorText}>{lastError}</Text>
        </View>
      ) : null}

      {nativeStatus === 'unavailable' ? (
        <Card title="Preview build">
          <Text style={styles.noteText}>
            This build does not include the native monitoring module yet, so nothing is detected or
            shared. Detection and Discord presence arrive in later development phases.
          </Text>
        </Card>
      ) : null}

      <StatusCard title="Albion Online" subtitle={detection.label} tone={detection.tone} />
      <StatusCard
        title="Discord"
        subtitle={discord.label}
        tone={discord.tone}
        trailing={discord.tone === 'ok' ? <CheckIcon color={colors.ok} /> : undefined}
      />

      <View style={styles.sessionCard}>
        <Text style={styles.sessionLabel}>Current Session</Text>
        <View style={styles.timerRow}>
          <ClockIcon color={colors.ivoryMuted} size={32} />
          <SessionDuration />
        </View>
        <Text style={styles.sessionCaption}>{sessionCaption}</Text>
      </View>

      <Card>
        <ToggleRow
          label="Automatic detection"
          description="Watches only the Albion Online app"
          value={native?.monitoring === 'running'}
          onValueChange={(next) => void onToggleDetection(next)}
          disabled={!available}
        />
        <InfoRow label="Presence publishing" value={publishing.label} tone={publishing.tone} />
        <LastSync />
      </Card>

      {permissionMissing ? (
        <Card title="Usage Access needed">
          <Text style={styles.noteText}>
            AlbionPresence needs Usage Access to see whether the Albion Online app is in the
            foreground. You grant it in Android settings and can revoke it there at any time.
          </Text>
          <PrimaryButton
            variant="secondary"
            label="Open Usage Access settings"
            onPress={() => void onRequestPermission()}
          />
        </Card>
      ) : null}

      <PrimaryButton
        variant="secondary"
        label="Open Settings"
        icon={<SlidersIcon color={colors.ivory} size={20} />}
        onPress={onOpenSettings}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 44,
  },
  logo: {
    width: 140,
    height: 140,
  },
  settingsButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    backgroundColor: 'rgba(224, 104, 95, 0.12)',
    borderColor: 'rgba(224, 104, 95, 0.5)',
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
  },
  noteText: {
    ...typography.body,
    color: colors.ivoryMuted,
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  sessionLabel: {
    ...typography.bodyStrong,
    color: colors.ivory,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  timer: {
    ...typography.timer,
    color: colors.ivory,
    fontVariant: ['tabular-nums'],
  },
  sessionCaption: {
    ...typography.body,
    color: colors.ivoryMuted,
  },
});
