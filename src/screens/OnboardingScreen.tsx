import React, { useRef, useState, type ReactElement } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckIcon, LockIcon, ShieldCheckIcon } from '../components/Icons';
import { PresencePreviewCard } from '../components/PresencePreviewCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing, typography } from '../theme';

const logo = require('../../assets/branding/albionpresence-logo.png');

type SlideKey = 'welcome' | 'share' | 'privacy' | 'permission' | 'ready';
const SLIDES: readonly SlideKey[] = ['welcome', 'share', 'privacy', 'permission', 'ready'];

const PRIVACY_POINTS: readonly string[] = [
  'No Discord token or password',
  'No game modification',
  'No analytics or tracking',
  'Open-source app code',
];

interface OnboardingScreenProps {
  onFinish: () => void;
}

function SlideBody({ slide }: { slide: SlideKey }): ReactElement {
  switch (slide) {
    case 'welcome':
      return (
        <>
          <Image source={logo} style={styles.heroLogo} resizeMode="contain" accessibilityLabel="AlbionPresence logo" accessibilityIgnoresInvertColors />
          <Text style={styles.title} accessibilityRole="header">Welcome to AlbionPresence</Text>
          <Text style={styles.body}>Your companion app for Albion Online and Discord.</Text>
        </>
      );
    case 'share':
      return (
        <>
          <PresencePreviewCard elapsedLabel="Example: 01:24:35 elapsed" />
          <Text style={styles.title} accessibilityRole="header">Show Your Activity on Discord</Text>
          <Text style={styles.body}>
            When Albion Online is open on this phone, AlbionPresence can show “Playing Albion Online” with a live timer.
          </Text>
        </>
      );
    case 'privacy':
      return (
        <>
          <ShieldCheckIcon color={colors.violetSoft} size={112} />
          <Text style={styles.title} accessibilityRole="header">Safe &amp; Privacy First</Text>
          <View style={styles.list}>
            {PRIVACY_POINTS.map((point) => (
              <View key={point} style={styles.listRow}>
                <CheckIcon color={colors.violetSoft} size={20} />
                <Text style={styles.listText}>{point}</Text>
              </View>
            ))}
          </View>
        </>
      );
    case 'permission':
      return (
        <>
          <LockIcon color={colors.violetSoft} size={96} />
          <Text style={styles.title} accessibilityRole="header">One Permission Needed</Text>
          <Text style={styles.body}>
            Usage Access lets AlbionPresence see whether the Albion Online app is in the foreground. It checks only that one app, and you can turn it off at any time in Android settings.
          </Text>
          <Text style={styles.note}>
            On Android 13 and newer you may also be asked for notification permission, so background monitoring can show a visible notice.
          </Text>
        </>
      );
    case 'ready':
      return (
        <>
          <Image source={logo} style={styles.heroLogo} resizeMode="contain" accessibilityIgnoresInvertColors />
          <Text style={styles.title} accessibilityRole="header">Ready to Begin?</Text>
          <Text style={styles.body}>Set up detection and share your Albion journey on Discord.</Text>
        </>
      );
  }
}

export function OnboardingScreen({ onFinish }: OnboardingScreenProps): ReactElement {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const goTo = (next: number) => {
    setIndex(next);
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
  };

  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          onPress={onFinish}
          hitSlop={12}
          style={styles.skip}
        >
          <Text style={styles.skipText}>{isLast ? 'Get Started' : 'Skip'}</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        style={styles.pager}
      >
        {SLIDES.map((slide) => (
          <View key={slide} style={[styles.page, { width }]}>
            <SlideBody slide={slide} />
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {SLIDES.map((slide, i) => (
            <View key={slide} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <PrimaryButton
          label={isLast ? 'Let’s Go!' : 'Next'}
          onPress={isLast ? onFinish : () => goTo(index + 1)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    height: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  skip: {
    minHeight: 44,
    justifyContent: 'center',
  },
  skipText: {
    ...typography.body,
    color: colors.ivoryMuted,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  heroLogo: {
    width: 260,
    height: 260,
  },
  title: {
    ...typography.title,
    color: colors.ivory,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    color: colors.ivoryMuted,
    textAlign: 'center',
  },
  note: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
  },
  list: {
    alignSelf: 'stretch',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  listText: {
    ...typography.body,
    color: colors.ivory,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceBorder,
  },
  dotActive: {
    backgroundColor: colors.violetSoft,
  },
});
