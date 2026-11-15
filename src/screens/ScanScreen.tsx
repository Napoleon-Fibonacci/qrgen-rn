/**
 * Layar pemindai. Kamera berhenti saat tab tidak aktif karena layar ini
 * di-unmount oleh App.tsx; tidak ada proses kamera yang menggantung.
 *
 * Hasil pindai hanya disimpan di memori. Tidak ditulis ke AsyncStorage karena
 * isinya bisa berupa sandi WiFi atau kontak.
 * Tampilan mengikuti `design/sleek/html/pemindai.html` dan layar status izin.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Linking,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import Clipboard from '@react-native-clipboard/clipboard';
import { Button, IconButton, Pill, SectionHeader, Toast, type PillTone } from '../components/ui';
import { Icon } from '../components/icons';
import { border, colors, radius, shadow, space, type } from '../theme';
import { isOpenable, linkSafety, safetyLabel, type Safety } from '../safety';

export interface ScanScreenProps {
  wide: boolean;
  /** Pindah ke tab generator, dipakai kartu izin kamera. */
  onGoGenerate?: () => void;
}

interface ScanResult {
  text: string;
  label: string;
  t: number;
  safety: Safety | null;
}

const RESULT_LIMIT = 30;
/** Sisi bingkai kamera, sama dengan desain (max-w-300). */
const STAGE_MAX = 300;

/** Nama format dari library dipetakan ke label Indonesia, sama seperti web. */
function formatLabel(format?: string): string {
  if (!format) {
    return 'Kode';
  }
  return format.replace(/_/g, ' ');
}

/** Warna pil mengikuti tingkat keamanan, teks tetap ada supaya tidak warna saja. */
function safetyTone(safety: Safety | null): PillTone {
  if (!safety || safety.level === 'ok') {
    return 'outline';
  }
  return safety.level === 'bad' ? 'danger' : 'signal';
}

function safetyIcon(safety: Safety | null) {
  if (!safety || safety.level === 'ok') {
    return 'shieldCheck' as const;
  }
  return safety.level === 'bad' ? ('warningOctagon' as const) : ('warning' as const);
}

export default function ScanScreen({ wide, onGoGenerate }: ScanScreenProps) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [running, setRunning] = useState(false);
  const [failed, setFailed] = useState(false);
  const [torch, setTorch] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const requestPermission = useCallback(async () => {
    setFailed(false);
    if (Platform.OS !== 'android') {
      // iOS memakai Info.plist (NSCameraUsageDescription); kamera langsung minta izin.
      setAllowed(true);
      setRunning(true);
      return;
    }
    try {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
        title: 'Izin kamera',
        message: 'Kamera dipakai buat membaca QR dan barcode. Gambarnya tidak dikirim ke mana pun.',
        buttonPositive: 'Boleh',
        buttonNegative: 'Nanti saja',
      });
      const ok = granted === PermissionsAndroid.RESULTS.GRANTED;
      setAllowed(ok);
      setRunning(ok);
      if (!ok) {
        showToast('Izin kamera ditolak. Aktifkan dari pengaturan aplikasi.');
      }
    } catch {
      setAllowed(false);
      showToast('Gagal meminta izin kamera');
    }
  }, [showToast]);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  const onReadCode = useCallback(
    (event: { nativeEvent: { codeStringValue?: string; codeFormat?: string } }) => {
      const text = event?.nativeEvent?.codeStringValue;
      if (!text) {
        return;
      }
      setResults((old) => {
        if (old.some((item) => item.text === text)) {
          return old;
        }
        const next: ScanResult[] = [
          {
            text,
            label: formatLabel(event.nativeEvent.codeFormat),
            t: Date.now(),
            safety: linkSafety(text),
          },
          ...old,
        ];
        return next.slice(0, RESULT_LIMIT);
      });
    },
    [],
  );

  const denied = allowed === false;

  return (
    <View style={styles.wrap}>
      <View style={[styles.columns, wide ? styles.columnsWide : null]}>
        <View style={[styles.cameraColumn, wide ? styles.cameraColumnWide : null]}>
          <View style={styles.stage} accessibilityLabel="Bingkai pemindaian kamera">
            {running ? (
              <Camera
                style={StyleSheet.absoluteFill}
                cameraType={CameraType.Back}
                scanBarcode
                showFrame={false}
                focusMode="on"
                torchMode={torch ? 'on' : 'off'}
                onReadCode={onReadCode}
                onError={() => {
                  setRunning(false);
                  setFailed(true);
                }}
              />
            ) : (
              <View style={styles.stageOff}>
                <View style={styles.stageOffIcon}>
                  <Icon name="cameraSlash" size={48} color={colors.inkSoft} />
                </View>
                <Text style={styles.stageOffText}>
                  {allowed === null ? 'Menyiapkan kamera' : 'Kamera nonaktif'}
                </Text>
              </View>
            )}

            {running ? (
              <View pointerEvents="none" style={styles.frame}>
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
                <View style={styles.scanline} />
              </View>
            ) : (
              <View pointerEvents="none" style={styles.watermark}>
                <Icon name="qrCode" size={64} color={colors.inkSoft} />
              </View>
            )}
          </View>

          <View style={styles.stageActions}>
            <Text style={styles.stageHint}>
              Arahkan kamera ke QR, pastikan seluruh kode masuk bingkai.
            </Text>
            <Button
              title="Senter"
              icon="flashlight"
              compact
              selected={torch}
              disabled={!running}
              onPress={() => setTorch((old) => !old)}
              accessibilityLabel={torch ? 'Matikan senter' : 'Nyalakan senter'}
            />
          </View>
        </View>

        <View style={[styles.resultsSection, wide ? styles.resultsSectionWide : null]}>
          <SectionHeader
            title="Hasil pindai"
            count={String(results.length)}
            right={
              results.length ? (
                <IconButton
                  name="trash"
                  onPress={() => setResults([])}
                  accessibilityLabel="Hapus semua hasil pindai"
                />
              ) : undefined
            }
          />

          {results.length === 0 ? (
            <Text style={styles.emptyResults}>Belum ada hasil</Text>
          ) : (
            results.map((item) => (
              <View key={item.text} style={styles.resultCard}>
                <View style={styles.resultHead}>
                  {item.safety ? (
                    <Pill
                      label={safetyLabel(item.safety)}
                      tone={safetyTone(item.safety)}
                      icon={safetyIcon(item.safety)}
                    />
                  ) : (
                    <View />
                  )}
                  <Text style={styles.resultFormat}>{item.label}</Text>
                </View>

                <Text style={styles.resultText} selectable>
                  {item.text}
                </Text>

                {item.safety && item.safety.level !== 'ok' ? (
                  <Text style={styles.resultWhy}>{item.safety.why.join('. ')}</Text>
                ) : null}

                <View style={styles.resultActions}>
                  <Button
                    title="Salin"
                    compact
                    onPress={() => {
                      Clipboard.setString(item.text);
                      showToast('Hasil ke-copy');
                    }}
                    accessibilityLabel="Salin hasil pindai"
                    style={styles.resultAction}
                  />
                  {isOpenable(item.text) ? (
                    <Button
                      title="Buka"
                      compact
                      variant={item.safety?.level === 'bad' ? 'dangerOutline' : 'primary'}
                      onPress={() => {
                        Linking.openURL(item.text).catch(() => showToast('Link gagal dibuka'));
                      }}
                      accessibilityLabel="Buka link hasil pindai"
                      style={styles.resultAction}
                    />
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {denied ? (
        <PermissionCard onRetry={requestPermission} onGoGenerate={onGoGenerate} />
      ) : null}

      {failed && !denied ? (
        <View style={styles.noticeCard}>
          <View style={styles.noticeHead}>
            <View style={styles.noticeIcon}>
              <Icon name="cameraSlash" size={20} color={colors.danger} />
            </View>
            <View style={styles.noticeText}>
              <Text style={type.sectionTitle}>Kamera tidak bisa dipakai</Text>
              <Text style={styles.noticeBody}>
                Tutup aplikasi lain yang sedang memakai kamera, lalu coba lagi.
              </Text>
            </View>
          </View>
          <Button
            title="Coba lagi"
            variant="primary"
            icon="refresh"
            onPress={requestPermission}
            accessibilityLabel="Coba pakai kamera lagi"
            style={styles.noticeButton}
          />
        </View>
      ) : null}

      <Toast message={toast} />
    </View>
  );
}

function PermissionCard({
  onRetry,
  onGoGenerate,
}: {
  onRetry: () => void;
  onGoGenerate?: () => void;
}) {
  return (
    <View style={styles.noticeCard}>
      <View style={styles.noticeHead}>
        <View style={styles.noticeIcon}>
          <Icon name="cameraSlash" size={20} color={colors.danger} />
        </View>
        <View style={styles.noticeText}>
          <Text style={type.sectionTitle}>Izin kamera ditolak</Text>
          <Text style={styles.noticeBody}>
            Kamera dibutuhkan untuk memindai QR. Izinkan akses kamera, lalu coba lagi.
          </Text>
        </View>
      </View>

      <View style={styles.noticeActions}>
        <Button
          title="Coba lagi"
          variant="primary"
          icon="refresh"
          onPress={onRetry}
          accessibilityLabel="Minta izin kamera lagi"
        />
        {onGoGenerate ? (
          <Button
            title="Buat QR"
            icon="plus"
            onPress={onGoGenerate}
            accessibilityLabel="Pindah ke layar buat QR"
          />
        ) : null}
        <Button
          title="Buka pengaturan"
          variant="ghost"
          icon="gear"
          onPress={() => Linking.openSettings().catch(() => undefined)}
          accessibilityLabel="Buka pengaturan aplikasi"
          style={styles.noticeLink}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.xl,
  },
  columns: {
    gap: space.xl,
  },
  columnsWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.xxl,
  },
  cameraColumn: {
    gap: space.md,
  },
  cameraColumnWide: {
    width: STAGE_MAX,
  },
  stage: {
    width: '100%',
    maxWidth: STAGE_MAX,
    aspectRatio: 1,
    alignSelf: 'center',
    borderRadius: radius.card,
    backgroundColor: colors.ink,
    overflow: 'hidden',
  },
  stageOff: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  stageOffIcon: {
    opacity: 0.7,
  },
  stageOffText: {
    ...type.buttonMini,
    color: colors.inkSoft,
  },
  watermark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.4,
  },
  frame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: colors.signal,
  },
  cornerTopLeft: {
    top: space.l,
    left: space.l,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 4,
  },
  cornerTopRight: {
    top: space.l,
    right: space.l,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 4,
  },
  cornerBottomLeft: {
    bottom: space.l,
    left: space.l,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 4,
  },
  cornerBottomRight: {
    bottom: space.l,
    right: space.l,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 4,
  },
  scanline: {
    position: 'absolute',
    left: space.xxxl + space.xs,
    right: space.xxxl + space.xs,
    top: '50%',
    height: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.cyan,
  },
  stageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  stageHint: {
    ...type.hint,
    flex: 1,
    maxWidth: 220,
  },
  resultsSection: {
    gap: space.l,
  },
  resultsSectionWide: {
    flex: 1,
  },
  emptyResults: {
    ...type.body,
    color: colors.inkSoft,
    textAlign: 'center',
    paddingVertical: space.l,
  },
  resultCard: {
    backgroundColor: colors.band,
    borderWidth: border.line,
    borderColor: colors.rule,
    borderRadius: radius.card,
    padding: space.md,
    gap: space.md,
    ...shadow.card,
  },
  resultHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  resultFormat: {
    ...type.hint,
  },
  resultText: {
    ...type.body,
    color: colors.ink,
  },
  resultWhy: {
    ...type.hint,
  },
  resultActions: {
    flexDirection: 'row',
    gap: space.sm,
  },
  resultAction: {
    flex: 1,
  },
  noticeCard: {
    backgroundColor: colors.card,
    borderWidth: border.line,
    borderColor: colors.rule,
    borderRadius: radius.card,
    padding: space.l,
    gap: space.l,
    ...shadow.card,
  },
  noticeHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  noticeIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.button,
    backgroundColor: colors.band,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeText: {
    flex: 1,
    gap: space.xs,
  },
  noticeBody: {
    ...type.body,
    color: colors.inkSoft,
  },
  noticeActions: {
    gap: space.sm,
  },
  noticeButton: {
    width: '100%',
  },
  noticeLink: {
    alignSelf: 'center',
  },
});
