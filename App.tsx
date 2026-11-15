/**
 * QrGenApp - tab "Buat" dan "Pindai".
 *
 * Navigasi masih pakai state biasa, belum react-navigation. Lihat AGENTS.md
 * bagian 6.
 *
 * @format
 */

import React, { useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import GenerateScreen from './src/screens/GenerateScreen';
import ScanScreen from './src/screens/ScanScreen';
import { useRise } from './src/components/ui';
import { border, colors, minTouch, radius, shadow, space, type, wideBreakpoint } from './src/theme';

export type Tab = 'generate' | 'scan';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [contentWidth, setContentWidth] = useState(0);
  const [tab, setTab] = useState<Tab>('generate');
  const rise = useRise();
  // Breakpoint dihitung dari lebar isi, bukan lebar jendela. Di pratinjau web,
  // isi dibatasi 460 px walau jendela browser jauh lebih lebar.
  const measuredWidth = contentWidth || windowWidth;
  const wide = measuredWidth >= wideBreakpoint;
  const gutter = windowWidth >= wideBreakpoint ? space.xxl : space.l;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: gutter, paddingBottom: insets.bottom + space.xxxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={styles.content}
          onLayout={(event) => setContentWidth(Math.round(event.nativeEvent.layout.width))}
        >
          <Animated.View style={[styles.brand, rise]}>
            <View style={styles.brandStrip} />
            <View style={styles.brandRow}>
              <View style={styles.brandMark}>
                <View style={styles.markSquare} />
                <View style={[styles.markSquare, styles.markSquareRight]} />
                <View style={[styles.markSquare, styles.markSquareBottom]} />
              </View>
              <View style={styles.brandText}>
                <Text
                  style={[type.appTitle, measuredWidth < 360 ? styles.appTitleNarrow : null]}
                  numberOfLines={1}
                >
                  COST QR Generator
                </Text>
                <Text style={type.tagline}>
                  Club of Science and Technology. Bikin QR buat link, WiFi, kontak, dan teks.
                </Text>
              </View>
            </View>
            <View style={styles.topnav}>
              <NavButton label="Buat QR" active={tab === 'generate'} onPress={() => setTab('generate')} />
              <NavButton label="Pindai" active={tab === 'scan'} onPress={() => setTab('scan')} />
            </View>
          </Animated.View>

          {tab === 'generate' ? (
            <GenerateScreen wide={wide} contentWidth={measuredWidth} />
          ) : (
            <ScanScreen wide={wide} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function NavButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      android_ripple={{ color: 'rgba(26, 86, 176, 0.12)' }}
      style={({ pressed }) => [
        styles.navbtn,
        active ? styles.navbtnActive : null,
        pressed && !active ? styles.navbtnPressed : null,
      ]}
    >
      <Text style={[styles.navbtnText, active ? styles.navbtnTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  scroll: {
    flexGrow: 1,
  },
  content: {
    width: '100%',
  },
  brand: {
    marginTop: space.xl,
    backgroundColor: colors.card,
    borderWidth: border.line,
    borderColor: colors.rule,
    borderRadius: radius.card,
    paddingHorizontal: space.xl,
    paddingTop: space.xxl,
    paddingBottom: space.l,
    overflow: 'hidden',
    ...shadow.card,
  },
  brandStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: border.headerStrip,
    backgroundColor: colors.blue,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.ml,
  },
  brandMark: {
    width: 46,
    height: 46,
    borderRadius: 9,
    backgroundColor: colors.blue,
    borderWidth: border.line,
    borderColor: colors.ruleStrong,
  },
  markSquare: {
    position: 'absolute',
    top: 9,
    left: 9,
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  markSquareRight: {
    left: 27,
  },
  markSquareBottom: {
    top: 27,
    left: 27,
    width: 5,
    height: 5,
  },
  brandText: {
    flex: 1,
  },
  appTitleNarrow: {
    fontSize: 16,
  },
  topnav: {
    flexDirection: 'row',
    gap: space.xs,
    marginTop: space.l,
    padding: space.xs,
    backgroundColor: colors.band,
    borderWidth: border.line,
    borderColor: colors.rule,
    borderRadius: radius.tabBar,
    alignSelf: 'flex-start',
  },
  navbtn: {
    minHeight: minTouch,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.chip,
  },
  navbtnActive: {
    backgroundColor: colors.blue,
  },
  navbtnPressed: {
    backgroundColor: 'rgba(14, 28, 46, 0.06)',
  },
  navbtnText: {
    ...type.buttonMini,
    fontSize: 13,
    color: colors.inkSoft,
  },
  navbtnTextActive: {
    color: '#ffffff',
  },
});

export default App;
