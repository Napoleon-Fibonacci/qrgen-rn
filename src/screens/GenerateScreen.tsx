/**
 * Layar generator QR. Empat tipe: URL, Teks, WiFi, Kontak.
 *
 * Alur: input -> buildPayload() di src/qr.ts -> string payload -> QRCode.
 * Simpan/bagikan lewat react-native-share, riwayat lewat AsyncStorage.
 * Tampilan mengikuti `design/sleek/html/generator.html` dan `riwayat.html`.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Share from 'react-native-share';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  Button,
  ConfirmDialog,
  Field,
  IconButton,
  Pill,
  SectionHeader,
  Segmented,
  Toast,
} from '../components/ui';
import { Icon } from '../components/icons';
import { border, colors, qrPreview, radius, shadow, space, type } from '../theme';
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
/** Lebar kolom pratinjau saat layar lebar. */
const PREVIEW_COLUMN = 340;
/** Sisi kotak thumbnail riwayat, termasuk border dan padding. */
const THUMB_SIZE = 64;

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

const TYPE_LABEL: Record<QrType, string> = {
  url: 'URL',
  text: 'Teks',
  wifi: 'WiFi',
  contact: 'Kontak',
};

const ENC_OPTIONS: ReadonlyArray<{ value: WifiEnc; label: string }> = [
  { value: 'WPA', label: 'WPA' },
  { value: 'WEP', label: 'WEP' },
  { value: 'nopass', label: 'Tanpa sandi' },
];

export interface GenerateScreenProps {
  wide: boolean;
  /** Lebar isi yang tersedia, sudah dikurangi padding layar. */
  contentWidth: number;
}

export default function GenerateScreen({ wide, contentWidth }: GenerateScreenProps) {
  const [qrType, setQrType] = useState<QrType>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [wifi, setWifi] = useState<WifiFields>({ ssid: '', password: '', enc: 'WPA', hidden: false });
  const [contact, setContact] = useState<ContactFields>({ name: '', tel: '', email: '', title: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [payload, setPayload] = useState<QrPayload | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
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

  // Ukuran QR: selebar kotak pratinjau, dibatasi 240 px seperti desain.
  const cardInner = (wide ? PREVIEW_COLUMN : contentWidth) - space.l * 2 - border.line * 2;
  const stageInner = cardInner - space.l * 2 - 2;
  const previewSize = Math.round(
    Math.max(120, Math.min(qrPreview.max, Math.max(qrPreview.min, stageInner))),
  );

  const contrast = contrastAgainstWhite(QR_COLOR);
  const tooLong = qrType === 'text' && text.length > TEXT_WARN_LIMIT;

  const applyHistoryItem = (item: HistoryItem) => {
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
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.columns, wide ? styles.columnsWide : null]}>
        <View style={[styles.formColumn, wide ? styles.formColumnWide : null]}>
          <Segmented
            options={TYPE_OPTIONS}
            value={qrType}
            onChange={setQrType}
            accessibilityLabel="Tipe isi QR"
            compact
          />

          <View style={styles.fields}>
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
                warn={tooLong ? 'Teks cukup panjang, QR bisa sulit dipindai.' : undefined}
                multiline
                numberOfLines={6}
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
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Keamanan</Text>
                  <Segmented
                    options={ENC_OPTIONS}
                    value={wifi.enc}
                    onChange={(value) => setWifi((old) => ({ ...old, enc: value }))}
                    accessibilityLabel="Jenis keamanan WiFi"
                    compact
                  />
                </View>
                {wifi.enc !== 'nopass' ? (
                  <Field
                    label="Sandi WiFi"
                    value={wifi.password}
                    onChangeText={(value) => setWifi((old) => ({ ...old, password: value }))}
                    placeholder="rahasia123"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    trailing={
                      <Pressable
                        onPress={() => setShowPassword((old) => !old)}
                        accessibilityRole="button"
                        accessibilityLabel={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                        hitSlop={8}
                        style={styles.trailingButton}
                      >
                        <Text style={styles.trailingText}>
                          {showPassword ? 'Tutup' : 'Lihat'}
                        </Text>
                      </Pressable>
                    }
                  />
                ) : null}
                <View style={styles.switchRow}>
                  <View style={styles.switchText}>
                    <Text style={styles.label}>Jaringan tersembunyi</Text>
                    <Text style={styles.hint}>Aktifkan kalau nama WiFi tidak dipancarkan.</Text>
                  </View>
                  <Switch
                    value={wifi.hidden}
                    onValueChange={(value) => setWifi((old) => ({ ...old, hidden: value }))}
                    trackColor={{ false: colors.ruleStrong, true: colors.blue }}
                    thumbColor={colors.card}
                    ios_backgroundColor={colors.ruleStrong}
                    accessibilityLabel="Jaringan tersembunyi"
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
        </View>

        <View style={[styles.previewColumn, wide ? styles.previewColumnWide : null]}>
          <View style={styles.previewCard}>
            <View style={styles.previewHead}>
              <Text style={type.sectionTitle}>Pratinjau</Text>
              <Pill label={TYPE_LABEL[qrType]} tone="neutral" />
            </View>
            <View style={styles.divider} />

            <View style={styles.qrStage}>
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
                <View style={styles.qrEmpty}>
                  <View style={styles.qrEmptyIcon}>
                    <Icon name="qrCode" size={64} color={colors.inkSoft} />
                  </View>
                  <Text style={styles.qrEmptyText}>
                    Isi dulu formnya, QR muncul di sini.
                  </Text>
                </View>
              )}
            </View>

            {payload ? (
              <Text style={styles.scanHint}>Arahkan kamera HP ke QR ini buat mencoba.</Text>
            ) : null}
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
      </View>

      <View style={styles.historySection}>
        <SectionHeader
          title="Riwayat"
          count={history.length + ' / ' + HISTORY_LIMIT}
          right={
            history.length ? (
              <Button
                title="Hapus semua"
                variant="dangerOutline"
                icon="trash"
                compact
                onPress={() => setConfirmClear(true)}
                accessibilityLabel="Hapus semua riwayat"
              />
            ) : undefined
          }
        />

        {history.length ? (
          history.map((item) => (
            <HistoryCard
              key={item.payload + item.t}
              item={item}
              onUse={() => applyHistoryItem(item)}
              onDelete={async () => {
                await persistHistory(history.filter((old) => old !== item));
                showToast('Satu riwayat dihapus');
              }}
            />
          ))
        ) : (
          <EmptyHistory />
        )}
      </View>

      <ConfirmDialog
        visible={confirmClear}
        title="Hapus semua riwayat?"
        message={
          'Semua ' +
          history.length +
          ' QR di riwayat akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.'
        }
        confirmLabel="Hapus"
        onCancel={() => setConfirmClear(false)}
        onConfirm={async () => {
          setConfirmClear(false);
          await persistHistory([]);
          showToast('Riwayat dibersihkan');
        }}
      />

      <Toast message={toast} />
    </View>
  );
}

function HistoryCard({
  item,
  onUse,
  onDelete,
}: {
  item: HistoryItem;
  onUse: () => void;
  onDelete: () => void;
}) {
  return (
    <Pressable
      onPress={onUse}
      accessibilityRole="button"
      accessibilityLabel={'Pakai lagi QR ' + item.label}
      accessibilityHint="Mengisi form dengan isi QR ini"
      android_ripple={{ color: 'rgba(26, 86, 176, 0.10)' }}
      style={({ pressed }) => [styles.historyCard, pressed ? styles.historyCardPressed : null]}
    >
      <View style={styles.thumb}>
        <QRCode
          value={item.payload}
          size={THUMB_SIZE - 8}
          color={colors.ink}
          backgroundColor={colors.card}
          ecl="M"
          quietZone={0}
        />
      </View>
      <View style={styles.historyMain}>
        <View style={styles.historyMeta}>
          <Pill label={TYPE_LABEL[item.type]} tone="primary" size="mini" />
          <Text style={styles.historyDate}>{formatDate(item.t)}</Text>
        </View>
        <Text style={styles.historyLabel} numberOfLines={1}>
          {item.label}
        </Text>
      </View>
      <IconButton
        name="trash"
        onPress={onDelete}
        accessibilityLabel={'Hapus QR ' + item.label}
      />
    </Pressable>
  );
}

/** Kartu kosong dari layar Status: ilustrasi bidang putus-putus dan tiga kotak. */
function EmptyHistory() {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyArt}>
        <View style={styles.emptyBox} />
        <View style={[styles.emptyBox, styles.emptyBoxTopRight]} />
        <View style={[styles.emptyBox, styles.emptyBoxBottomLeft]} />
        <View style={[styles.emptyDot, styles.emptyDotCyan]} />
        <View style={[styles.emptyDot, styles.emptyDotSoft1]} />
        <View style={[styles.emptyDot, styles.emptyDotSoft2]} />
      </View>
      <View style={styles.emptyText}>
        <Text style={type.sectionTitle}>Belum ada QR</Text>
        <Text style={styles.emptyBody}>
          Mulai dari link, teks, WiFi, atau kontak. QR pertama kamu siap dalam hitungan detik.
        </Text>
      </View>
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
    gap: space.xxl,
  },
  columns: {
    gap: space.xl,
  },
  columnsWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.xxl,
  },
  formColumn: {
    gap: space.l,
  },
  formColumnWide: {
    flex: 1,
  },
  fields: {
    gap: space.l,
  },
  fieldGroup: {
    gap: space.s,
  },
  label: {
    ...type.label,
  },
  hint: {
    ...type.hint,
  },
  trailingButton: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  trailingText: {
    ...type.buttonMini,
    color: colors.blue,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.l,
    minHeight: 44,
  },
  switchText: {
    flex: 1,
    gap: space.xs,
  },
  previewColumn: {
    width: '100%',
  },
  previewColumnWide: {
    width: PREVIEW_COLUMN,
  },
  previewCard: {
    backgroundColor: colors.card,
    borderWidth: border.line,
    borderColor: colors.rule,
    borderRadius: radius.card,
    padding: space.l,
    gap: space.l,
    ...shadow.card,
  },
  previewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.rule,
  },
  qrStage: {
    width: '100%',
    minHeight: 180,
    backgroundColor: '#ffffff',
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: colors.rule,
    padding: space.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrEmpty: {
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.l,
  },
  qrEmptyIcon: {
    opacity: 0.35,
  },
  qrEmptyText: {
    ...type.hint,
    textAlign: 'center',
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
    gap: space.sm,
  },
  actionButton: {
    width: '100%',
  },
  historySection: {
    gap: space.l,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.band,
    borderWidth: border.line,
    borderColor: colors.rule,
    borderRadius: radius.card,
    padding: space.md,
    ...shadow.card,
  },
  historyCardPressed: {
    backgroundColor: '#d7e2ef',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.chip,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  historyMain: {
    flex: 1,
    gap: space.xs,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  historyDate: {
    ...type.hint,
  },
  historyLabel: {
    ...type.body,
    color: colors.ink,
  },
  emptyCard: {
    backgroundColor: colors.band,
    borderWidth: border.line,
    borderColor: colors.rule,
    borderRadius: radius.card,
    padding: space.xl,
    alignItems: 'center',
    gap: space.l,
    ...shadow.card,
  },
  emptyArt: {
    width: 112,
    height: 112,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.inkSoft,
    backgroundColor: colors.card,
  },
  emptyBox: {
    position: 'absolute',
    left: 18,
    top: 18,
    width: 26,
    height: 26,
    borderRadius: 3,
    borderWidth: 3,
    borderColor: colors.blue,
  },
  emptyBoxTopRight: {
    left: 68,
  },
  emptyBoxBottomLeft: {
    top: 68,
  },
  emptyDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 1,
  },
  emptyDotCyan: {
    left: 52,
    top: 52,
    backgroundColor: colors.cyan,
  },
  emptyDotSoft1: {
    left: 60,
    top: 40,
    width: 6,
    height: 6,
    backgroundColor: colors.inkSoft,
    opacity: 0.4,
  },
  emptyDotSoft2: {
    left: 76,
    top: 76,
    backgroundColor: colors.inkSoft,
    opacity: 0.4,
  },
  emptyText: {
    gap: space.sm,
    alignItems: 'center',
  },
  emptyBody: {
    ...type.body,
    color: colors.inkSoft,
    textAlign: 'center',
  },
});
