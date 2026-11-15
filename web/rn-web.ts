/**
 * Shim `react-native` untuk pratinjau web.
 *
 * Vite mengarahkan import `react-native` ke berkas ini. Isinya react-native-web
 * plus modul yang hanya ada di Android/iOS, supaya kode layar tidak perlu diubah.
 */
export * from 'react-native-web';

/**
 * react-native-web tidak punya PermissionsAndroid. Di browser tidak ada izin
 * aplikasi, jadi permintaan selalu dianggap disetujui.
 */
export const PermissionsAndroid = {
  PERMISSIONS: { CAMERA: 'android.permission.CAMERA' },
  RESULTS: { GRANTED: 'granted', DENIED: 'denied', NEVER_ASK_AGAIN: 'never_ask_again' },
  request: async () => 'granted',
  check: async () => true,
  requestMultiple: async () => ({}),
};
