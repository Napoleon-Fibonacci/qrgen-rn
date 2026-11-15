/**
 * Layar generator QR. Empat tipe: URL, Teks, WiFi, Kontak.
 *
 * Alur: input -> buildPayload() di src/qr.ts -> string payload -> QRCode.
 * Simpan/bagikan lewat react-native-share, riwayat lewat AsyncStorage.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Share from 'react-native-share';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import { Button, Field, Segmented, Toast } from '../components/ui';
import {
  border,
  colors,
  qrPreview,
  radius,
  shadow,
  space,
  type,
} from '../theme';
import {
  buildPayload,
  contrastAgainstWhite,
  fileName,
  type ContactFields,
  type QrPayload,
  type QrType,
  type WifiEnc,
  type WifiFields,
} from '../qr';
import { CONTRAST_LIMIT, TEXT_WARN_LIMIT } from '../qr';

const HISTORY_KEY = 'qrgen_history_v1';
const HISTORY_LIMIT = 20;
const DEBOUNCE_MS = 180;
const QR_COLOR = '#111111';

interface HistoryItem {
  t: number;
  type: QrType;
  label: string;
  payload: string;
}

const TYPE_OPTIONS: ReadonlyArray<{ value: QrType; label: string }> = [
  { value: 'url', label: 'URL' },
  { value: 'text', label: 'Teks' },
  { value: 'wifi', label: 'WiFi' },
  { value: 'contact', label: 'Kontak' },
];

const ENC_OPTIONS: ReadonlyArray<{ value: WifiEnc; label: string }> = [
  { value: 'WPA', label: 'WPA/WPA2' },
  { value: 'WEP', label: 'WEP' },
  { value: 'nopass', label: 'Tanpa sandi' },
];

export interface GenerateScreenProps {
  wide: boolean;
}

export default function GenerateScreen({ wide }: GenerateScreenProps) {
  const { width } = useWindowDimensions();
  const [qrType, setQrType] = useState<QrType>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [wifi, setWifi] = useState<WifiFields>({ ssid: '', password: '', enc: 'WPA', hidden: false });
  const [contact, setContact] = useState<ContactFields>({ name: '', tel: '', email: '', title: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [payload, setPayload] = useState<QrPayload | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const qrRef = useRef<{ toDataURL: (callback: (data: string) => void) => void } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useMemo(() => ({ url, text, wifi, contact }), [url, text, wifi, contact]);

  // Debounce 180ms: QR baru dirender setelah pengguna berhenti mengetik.
  useEffect(() => {
    const next = buildPayload(qrType, form);
    const timer = setTimeout(() => setPayload(next), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [qrType, form]);

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

  // Riwayat hanya disimpan saat pengguna sengaja menyimpan atau menyalin.
  const loadHistory = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setHistory(Array.isArray(parsed) ? parsed : []);
    } catch {
      // AsyncStorage gagal: biarkan riwayat kosong, jangan menulis apa pun.
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const persistHistory = useCallback(async (list: HistoryItem[]) => {
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(list));
      setHistory(list);
    } catch {
      // Gagal menyimpan tidak boleh menggagalkan aksi utama.
    }
  }, []);

  const addHistory = useCallback(
    async (item: QrPayload) => {
      const entry: HistoryItem = { t: Date.now(), type: qrType, label: item.label, payload: item.data };
      const next = [entry, ...history.filter((old) => old.payload !== item.data)].slice(0, HISTORY_LIMIT);
      await persistHistory(next);
    },
    [history, persistHistory, qrType],
  );

  const sharePng = useCallback(() => {
    if (!payload || !qrRef.current) {
      return;
    }
    try {
      qrRef.current.toDataURL(async (base64) => {
        const dataUri = base64.startsWith('data:') ? base64 : 'data:image/png;base64,' + base64;
        try {
          await Share.open({
            url: dataUri,
            type: 'image/png',
            filename: fileName({ type: qrType, label: payload.label, ext: 'png' }).replace(/\.png$/, ''),
            failOnCancel: false,
          });
          await addHistory(payload);
        } catch {
          showToast('Gagal membagikan gambar');
        }
      });
    } catch {
      showToast('Gagal menyiapkan PNG');
    }
  }, [addHistory, payload, qrType, showToast]);

  const previewSize = Math.round(
    Math.min(qrPreview.max, Math.max(qrPreview.min, (wide ? width * 0.34 : width) - space.xxl * 4)),
  );

  const contrast = contrastAgainstWhite(QR_COLOR);
  const tooLong = qrType === 'text' && text.length > TEXT_WARN_LIMIT;

  return (
    <View style={[styles.wrap, wide ? styles.wrapWide : null]}>
      <View style={[styles.column, wide ? styles.columnWide : null]}>
        <Segmented
          options={TYPE_OPTIONS}
          value={qrType}
          onChange={setQrType}
          accessibilityLabel="Tipe isi QR"
        />

        <View style={styles.panel}>
          {qrType === 'url' ? (
            <Field
              label="Link / URL"
              value={url}
              onChangeText={setUrl}
              placeholder="sekolah.sch.id/absensi"
              hint="Tanpa https:// juga bisa, otomatis dilengkapi."
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
          ) : null}

          {qrType === 'text' ? (
            <Field
              label="Teks"
              value={text}
              onChangeText={setText}
              placeholder="Tulis pengumuman, catatan, atau teks apa aja"
              hint={text.length + ' karakter'}
              warn={
                tooLong
                  ? 'Teksnya panjang banget. QR-nya jadi padat dan susah ke-scan dari jauh, apalagi buat banner.'
                  : undefined
              }
              multiline
              numberOfLines={5}
            />
          ) : null}

          {qrType === 'wifi' ? (
            <>
              <Field
                label="Nama WiFi (SSID)"
                value={wifi.ssid}
                onChangeText={(value) => setWifi((old) => ({ ...old, ssid: value }))}
                placeholder="WiFi-Sekolah"
                autoCorrect={false}
              />
              <Segmented
                options={ENC_OPTIONS}
                value={wifi.enc}
                onChange={(value) => setWifi((old) => ({ ...old, enc: value }))}
                accessibilityLabel="Jenis keamanan WiFi"
              />
              {wifi.enc !== 'nopass' ? (
                <Field
                  label="Sandi WiFi"
                  value={wifi.password}
                  onChangeText={(value) => setWifi((old) => ({ ...old, password: value }))}
                  placeholder="rahasia123"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  hint="Tanpa sandi? Pilih Tanpa sandi di atas."
                />
              ) : null}
              <View style={styles.row}>
                <Button
                  title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                  variant="mini"
                  onPress={() => setShowPassword((old) => !old)}
                  style={styles.rowButton}
                />
                <Button
                  title={wifi.hidden ? 'Jaringan tersembunyi: aktif' : 'Jaringan tersembunyi: mati'}
                  variant="mini"
                  onPress={() => setWifi((old) => ({ ...old, hidden: !old.hidden }))}
                  style={styles.rowButton}
                />
              </View>
            </>
          ) : null}

          {qrType === 'contact' ? (
            <>
              <Field
                label="Nama lengkap"
                value={contact.name}
                onChangeText={(value) => setContact((old) => ({ ...old, name: value }))}
                placeholder="Budi Santoso"
                autoCapitalize="words"
              />
              <Field
                label="Nomor telepon"
                value={contact.tel}
                onChangeText={(value) => setContact((old) => ({ ...old, tel: value }))}
                placeholder="08123456789"
                keyboardType="phone-pad"
              />
              <Field
                label="Email"
                value={contact.email}
                onChangeText={(value) => setContact((old) => ({ ...old, email: value }))}
                placeholder="budi@sekolah.id"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Field
                label="Jabatan"
                value={contact.title}
                onChangeText={(value) => setContact((old) => ({ ...old, title: value }))}
                placeholder="Guru Matematika"
                autoCapitalize="words"
              />
            </>
          ) : null}
        </View>

        <HistoryList
          items={history}
          onClear={() => persistHistory([])}
          onUse={(item) => {
            setQrType(item.type);
            if (item.type === 'url') {
              setUrl(item.payload);
              showToast('Isi QR lama dimuat');
            } else if (item.type === 'text') {
              setText(item.payload);
              showToast('Isi QR lama dimuat');
            } else {
              // Payload WiFi dan vCard belum dipecah balik ke field.
              showToast('Tipe ini belum bisa dimuat ulang, salin saja isinya');
            }
          }}
        />
      </View>

      <View style={[styles.column, styles.previewColumn, wide ? styles.columnWide : null]}>
        <View style={styles.previewCard}>
          <Text style={type.sectionTitle}>Pratinjau</Text>
          <View style={[styles.qrStage, { width: previewSize, height: previewSize }]}>
            {payload ? (
              <QRCode
                value={payload.data}
                size={previewSize}
                color={QR_COLOR}
                backgroundColor="#ffffff"
                ecl="M"
                quietZone={8}
                getRef={(ref: unknown) => {
                  qrRef.current = ref as typeof qrRef.current;
                }}
              />
            ) : (
              <Text style={styles.emptyText}>Isi dulu formnya, QR muncul di sini.</Text>
            )}
          </View>
          {payload ? <Text style={styles.scanHint}>Arahkan kamera HP ke QR ini buat mencoba.</Text> : null}
          {contrast < CONTRAST_LIMIT ? (
            <Text style={styles.warn}>
              Warnanya kurang kontras. Ganti ke warna lebih gelap biar tetap kebaca.
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Button
              title="Simpan PNG"
              variant="primary"
              onPress={sharePng}
              disabled={!payload}
              style={styles.actionButton}
            />
            <Button
              title="Salin isi"
              onPress={async () => {
                if (!payload) {
                  return;
                }
                try {
                  Clipboard.setString(payload.data);
                  await addHistory(payload);
                  showToast('Isi QR ke-copy');
                } catch {
                  showToast('Gagal copy, salin manual');
                }
              }}
              disabled={!payload}
              style={styles.actionButton}
            />
          </View>
        </View>
      </View>

      <Toast message={toast} />
    </View>
  );
}

function HistoryList({
  items,
  onClear,
  onUse,
}: {
  items: HistoryItem[];
  onClear: () => void;
  onUse: (item: HistoryItem) => void;
}) {
  if (!items.length) {
    return null;
  }
  return (
    <View style={styles.history}>
      <View style={styles.historyHead}>
        <Text style={type.sectionTitle}>Riwayat</Text>
        <Button title="Hapus semua" variant="danger" onPress={onClear} accessibilityLabel="Hapus semua riwayat" />
      </View>
      {items.map((item) => (
        <View key={item.payload + item.t} style={styles.historyItem}>
          <View style={styles.historyText}>
            <Text style={styles.historyLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={styles.historyDate}>{formatDate(item.t)}</Text>
          </View>
          <Button
            title="Pakai"
            variant="mini"
            onPress={() => onUse(item)}
            accessibilityLabel={'Pakai lagi ' + item.label}
          />
        </View>
      ))}
    </View>
  );
}

function formatDate(time: number): string {
  const date = new Date(time);
  const day = date.getDate();
  const month = date.toLocaleDateString('id-ID', { month: 'short' });
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return day + ' ' + month + ' ' + date.getFullYear() + ', ' + hh + '.' + mm;
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: space.xl,
    gap: space.xl,
  },
  wrapWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    gap: space.xl,
  },
  columnWide: {
    flex: 1,
  },
  panel: {
    marginTop: space.l,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  rowButton: {
    flexGrow: 1,
  },
  previewColumn: {
    marginTop: 0,
  },
  previewCard: {
    backgroundColor: colors.card,
    borderWidth: border.line,
    borderColor: colors.rule,
    borderRadius: radius.card,
    padding: space.xl,
    gap: space.md,
    ...shadow.card,
  },
  qrStage: {
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: radius.card,
    borderWidth: border.line,
    borderColor: colors.rule,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emptyText: {
    ...type.hint,
    textAlign: 'center',
    paddingHorizontal: space.l,
  },
  scanHint: {
    ...type.hint,
    textAlign: 'center',
  },
  warn: {
    ...type.hint,
    color: colors.ink,
    backgroundColor: 'rgba(255, 210, 63, 0.35)',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(14, 28, 46, 0.18)',
    paddingHorizontal: space.m,
    paddingVertical: space.sm,
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    gap: space.sm,
  },
  actionButton: {
    flex: 1,
  },
  history: {
    backgroundColor: colors.band,
    borderWidth: border.line,
    borderColor: colors.rule,
    borderRadius: radius.card,
    padding: space.m,
    gap: space.sm,
  },
  historyHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.card,
    borderWidth: border.line,
    borderColor: colors.rule,
    borderRadius: radius.chip,
    padding: space.sm,
  },
  historyText: {
    flex: 1,
  },
  historyLabel: {
    ...type.label,
    fontSize: 14,
  },
  historyDate: {
    ...type.hint,
    fontSize: 12.5,
  },
});
