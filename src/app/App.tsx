import React, { useState, type ReactElement } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TabBar, type TabKey } from '../components/TabBar';
import { usePresenceSync } from '../hooks/usePresenceSync';
import { AboutScreen } from '../screens/AboutScreen';
import { ComingSoonScreen } from '../screens/ComingSoonScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { PreviewScreen } from '../screens/PreviewScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { useAppStore } from '../store/useAppStore';
import { usePresenceStore } from '../store/usePresenceStore';
import { colors } from '../theme';

function Screen({ tab, goTo }: { tab: TabKey; goTo: (tab: TabKey) => void }): ReactElement {
  switch (tab) {
    case 'home':
      return <DashboardScreen onOpenSettings={() => goTo('settings')} />;
    case 'preview':
      return <PreviewScreen />;
    case 'settings':
      return (
        <ComingSoonScreen
          title="Settings"
          phase="Phase 4"
          description="Automatic detection, publishing, grace period, notifications, language, theme and reset. Settings are stored natively, which does not exist yet."
        />
      );
    case 'about':
      return <AboutScreen />;
  }
}

export default function App(): ReactElement {
  usePresenceSync();
  const nativeStatus = usePresenceStore((s) => s.nativeStatus);
  const onboardingCompleted = useAppStore((s) => s.onboardingCompleted);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [tab, setTab] = useState<TabKey>('home');

  let content: ReactElement;
  if (nativeStatus === 'checking') {
    content = <SplashScreen />;
  } else if (!onboardingCompleted) {
    content = <OnboardingScreen onFinish={completeOnboarding} />;
  } else {
    content = (
      <View style={styles.root}>
        <View style={styles.body}>
          <Screen tab={tab} goTo={setTab} />
        </View>
        <TabBar active={tab} onChange={setTab} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {content}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
  },
});
