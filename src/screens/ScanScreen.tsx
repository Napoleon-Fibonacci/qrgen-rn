/**
 * Layar pemindai. Kamera berhenti saat tab tidak aktif karena layar ini
 * di-unmount oleh App.tsx; tidak ada proses kamera yang menggantung.
 *
 * Hasil pindai hanya disimpan di memori. Tidak ditulis ke AsyncStorage karena
 * isinya bisa berupa sandi WiFi atau kontak.
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
import { Button, Toast } from '../components/ui';
import { border, colors, radius, scanStatus, shadow, space, type } from '../theme';
import { isOpenable, linkSafety, safetyLabel, type Safety } from '../safety';

export interface ScanScreenProps {
  wide: boolean;
}

interface ScanResult {
  text: string;
  label: string;
  t: number;
  safety: Safety | null;
}

const RESULT_LIMIT = 30;

/** Nama format dari library dipetakan ke label Indonesia, sama seperti web. */
function formatLabel(format?: string): string {
  if (!format) {
    return 'Kode';
  }
  return format.replace(/_/g, ' ');
}

export default function ScanScreen({ wide }: ScanScreenProps) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [running, setRunning] = useState(false);
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

  return (
    <View style={styles.wrap}>
      <View style={[styles.cameraCard, wide ? styles.cameraCardWide : null]}>
        <Text style={type.sectionTitle}>Pindai</Text>
        <Text style={type.hint}>
          Arahkan kamera ke QR atau barcode. Hasil cuma disimpan di layar ini, tidak permanen.
        </Text>

        <View style={styles.cameraStage}>
          {running ? (
            <>
              <Camera
                style={StyleSheet.absoluteFill}
                cameraType={CameraType.Back}
                scanBarcode
                showFrame={false}
                focusMode="on"
                onReadCode={onReadCode}
                onError={() => showToast('Kamera gagal dipakai')}
              />
              <View pointerEvents="none" style={styles.frame}>
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
              </View>
              <Button
                title="Berhenti"
                onPress={() => setRunning(false)}
                style={styles.cameraButton}
                accessibilityLabel="Berhenti memindai"
              />
            </>
          ) : (
            <View style={styles.cameraOff}>
              <Text style={styles.cameraOffText}>
                {allowed === false
                  ? 'Izin kamera belum diberikan. Tekan tombol di bawah untuk mencoba lagi.'
                  : 'Kamera mati. Tekan Mulai kamera.'}
              </Text>
              <Button
                title={allowed === false ? 'Minta izin lagi' : 'Mulai kamera'}
                variant="primary"
                onPress={requestPermission}
                accessibilityLabel="Mulai kamera"
              />
            </View>
          )}
        </View>
      </View>

      <View style={styles.results}>
        <Text style={type.sectionTitle}>Hasil pindai</Text>
        {results.length === 0 ? (
          <Text style={type.hint}>Belum ada yang ke-scan.</Text>
        ) : (
          results.map((item) => (
            <View key={item.text} style={styles.resultRow}>
              <View style={styles.resultMain}>
                <View style={styles.resultHead}>
                  <Text style={styles.resultLabel}>{item.label}</Text>
                  {item.safety ? (
                    <View
                      style={[
                        styles.pill,
                        {
                          backgroundColor:
                            item.safety.level === 'ok'
                              ? scanStatus.aman.background
                              : item.safety.level === 'warn'
                              ? scanStatus.waspada.background
                              : scanStatus.bahaya.background,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          {
                            color:
                              item.safety.level === 'ok'
                                ? scanStatus.aman.text
                                : item.safety.level === 'warn'
                                ? scanStatus.waspada.text
                                : scanStatus.bahaya.text,
                          },
                        ]}
                      >
                        {safetyLabel(item.safety)}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.resultText} numberOfLines={3}>
                  {item.text}
                </Text>
                {item.safety && item.safety.level !== 'ok' ? (
                  <Text style={styles.resultWhy}>{item.safety.why.join('. ')}</Text>
                ) : null}
              </View>
              <View style={styles.resultActions}>
                <Button
                  title="Salin"
                  variant="mini"
                  onPress={() => {
                    Clipboard.setString(item.text);
                    showToast('Hasil ke-copy');
                  }}
                  accessibilityLabel="Salin hasil pindai"
                />
                {isOpenable(item.text) ? (
                  <Button
                    title="Buka"
                    variant="mini"
                    onPress={() => {
                      Linking.openURL(item.text).catch(() => showToast('Link gagal dibuka'));
                    }}
                    accessibilityLabel="Buka link hasil pindai"
                  />
                ) : null}
              </View>
            </View>
          ))
        )}
        {results.length > 0 ? (
          <Button title="Hapus semua hasil" variant="danger" onPress={() => setResults([])} />
        ) : null}
      </View>

      <Toast message={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: space.xl,
    gap: space.xl,
  },
  cameraCard: {
    backgroundColor: colors.card,
    borderWidth: border.line,
    borderColor: colors.rule,
    borderRadius: radius.card,
    padding: space.xl,
    gap: space.md,
    ...shadow.card,
  },
  cameraCardWide: {
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  cameraStage: {
    aspectRatio: 1,
    borderRadius: radius.card,
    backgroundColor: colors.ink,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: space.xxl,
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colors.signal,
  },
  cornerTopLeft: {
    top: space.xxl,
    left: space.xxl,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  cornerTopRight: {
    top: space.xxl,
    right: space.xxl,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  cornerBottomLeft: {
    bottom: space.xxl,
    left: space.xxl,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  cornerBottomRight: {
    bottom: space.xxl,
    right: space.xxl,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },
  cameraButton: {
    position: 'absolute',
    bottom: space.md,
    alignSelf: 'center',
    backgroundColor: colors.card,
  },
  cameraOff: {
    padding: space.xl,
    gap: space.md,
    alignItems: 'center',
  },
  cameraOffText: {
    ...type.hint,
    textAlign: 'center',
  },
  results: {
    backgroundColor: colors.band,
    borderWidth: border.line,
    borderColor: colors.rule,
    borderRadius: radius.card,
    padding: space.m,
    gap: space.sm,
  },
  resultRow: {
    backgroundColor: colors.card,
    borderWidth: border.line,
    borderColor: colors.rule,
    borderRadius: radius.chip,
    padding: space.m,
    gap: space.sm,
  },
  resultMain: {
    gap: space.xs,
  },
  resultHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  resultLabel: {
    ...type.label,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.inkSoft,
  },
  resultText: {
    ...type.body,
    fontSize: 15,
  },
  resultWhy: {
    ...type.hint,
    color: colors.inkSoft,
  },
  resultActions: {
    flexDirection: 'row',
    gap: space.sm,
  },
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: space.m,
    paddingVertical: 2,
  },
  pillText: {
    fontFamily: type.buttonMini.fontFamily,
    fontSize: 12,
  },
});
