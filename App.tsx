/**
 * QrGenApp - tab "Buat" dan "Pindai".
 *
 * Navigasi masih pakai state biasa, belum react-navigation. Lihat AGENTS.md
 * bagian 6. Header bergaya pita penuh dengan strip biru di atas, mengikuti
 * desain Sleek di `design/sleek/`.
 *
 * @format
 */

import React, { useState } from 'react';
import {
  Animated,
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
import { Segmented, useRise } from './src/components/ui';
import { border, colors, radius, space, type, wideBreakpoint } from './src/theme';

export type Tab = 'generate' | 'scan';

const NAV_OPTIONS: ReadonlyArray<{ value: Tab; label: string }> = [
  { value: 'generate', label: 'Buat QR' },
  { value: 'scan', label: 'Pindai' },
];

/** Lebar isi maksimal di layar besar supaya baris teks tidak melebar. */
const CONTENT_MAX = 960;

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
  // Breakpoint dihitung dari lebar isi, bukan lebar jendela. Di pratinjau web, isi
  // dibatasi CONTENT_MAX walau jendela browser jauh lebih lebar.
  const measuredWidth = contentWidth || windowWidth;
  const wide = measuredWidth >= wideBreakpoint;
  const gutter = windowWidth >= wideBreakpoint ? space.xxl : space.l;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerStrip} />
        <View style={styles.headerInner}>
          <View style={styles.brandRow}>
            <LogoMark />
            <View style={styles.brandText}>
              <Text style={type.appTitle} numberOfLines={1}>
                COST QR Generator
              </Text>
              <Text style={type.tagline} numberOfLines={2}>
                Buat dan pindai QR dalam satu alat.
              </Text>
            </View>
          </View>
          <View style={styles.headerRule} />
          <View style={styles.nav}>
            <Segmented
              options={NAV_OPTIONS}
              value={tab}
              onChange={setTab}
              accessibilityLabel="Pilih layar"
              tone="paper"
            />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: gutter, paddingBottom: insets.bottom + space.xxxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[styles.content, rise]}
          onLayout={(event) => setContentWidth(Math.round(event.nativeEvent.layout.width))}
        >
          {tab === 'generate' ? (
            <GenerateScreen wide={wide} contentWidth={measuredWidth} />
          ) : (
            <ScanScreen wide={wide} onGoGenerate={() => setTab('generate')} />
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

/** Tanda tiga kotak biru dan satu kotak cyan, seperti logo COST. */
function LogoMark() {
  return (
    <View style={styles.logo} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.logoRow}>
        <View style={styles.logoCell} />
        <View style={styles.logoCell} />
      </View>
      <View style={styles.logoRow}>
        <View style={styles.logoCell} />
        <View style={[styles.logoCell, styles.logoCellAccent]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    backgroundColor: colors.band,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  headerStrip: {
    height: border.headerStrip,
    backgroundColor: colors.blue,
  },
  headerInner: {
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
    paddingHorizontal: space.l,
    paddingTop: space.l,
    paddingBottom: space.l,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  logo: {
    width: 32,
    height: 32,
    gap: 2,
  },
  logoRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
  },
  logoCell: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: colors.blue,
  },
  logoCellAccent: {
    backgroundColor: colors.cyan,
  },
  brandText: {
    flex: 1,
  },
  headerRule: {
    width: 56,
    height: border.titleUnderline,
    borderRadius: radius.pill,
    backgroundColor: colors.signal,
    marginTop: space.sm,
  },
  nav: {
    marginTop: space.l,
    width: '100%',
    maxWidth: 420,
  },
  scroll: {
    flexGrow: 1,
  },
  content: {
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
    paddingTop: space.l,
  },
});

export default App;
