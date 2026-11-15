# QrGenApp

Percobaan membuat ulang COST QR Generator sebagai aplikasi Android React Native.
Proyek web aslinya ada di `../qrgen` dan tidak diubah dari sini.

Isi versi pertama: generator QR (URL, teks, WiFi, kontak) dan pemindai kamera.
Rencana, keputusan, dan sistem visual lengkap ada di `AGENTS.md`.

## Kenapa React Native

Proyek web sudah dibungkus Capacitor dan jalan. Proyek ini bukan port, melainkan
latihan membangun UI native: `View`, `Text`, `TextInput`, Metro, Gradle, dan APK
dari GitHub Actions.

## Menjalankan di mesin lokal

Butuh Node 22 atau lebih baru, JDK 21, dan Android SDK.

```sh
npm install
npm start            # Metro, terminal pertama
npm run android      # pasang ke HP/emulator, terminal kedua
npm test             # unit test logika murni
npm run lint
```

`npm test` dan `npm run lint` tidak butuh Android SDK, jadi bisa jalan di mesin
mana pun.

## Pratinjau web (live preview tanpa emulator)

Alat ini untuk melihat UI sambil mengetik, bukan pengganti uji APK.

```sh
npm run web
```

Lalu buka `http://localhost:5173`. Di VSCode/Cursor: **Command Palette → Simple
Browser: Show** dan isi URL itu, supaya preview menempel di panel sebelah kode.
Fast Refresh aktif: setiap simpan berkas, layar langsung berubah.

Batasannya:

- `react-native` dijalankan lewat `react-native-web`, bukan mesin Android.
- Kamera diganti stub bertuliskan "Kamera tidak tersedia di pratinjau web".
- "Simpan PNG" menghasilkan SVG lewat data URI, bukan PNG dari Android.
- Hasil build-nya tidak bisa dipakai sebagai bukti aplikasi Android berjalan.

Isi folder `web/` hanya untuk pratinjau. Jangan mengimpor berkas dari sana di
kode aplikasi.

## Build APK lewat GitHub Actions

Workflow `.github/workflows/android.yml` menjalankan lint, unit test, lalu
`./gradlew assembleRelease` dengan tanda tangan debug. Hasilnya APK yang bisa
dibagikan tanpa Metro.

1. Push repo ke GitHub.
2. Buka tab **Actions**, pilih run terbaru.
3. Unduh artifact `qrgenapp-release-apk`.
4. Pasang APK di HP (izinkan "instal dari sumber tidak dikenal").

Karena memakai `android/app/debug.keystore` yang ikut di-commit, build baru bisa
menimpa build lama tanpa uninstall. Jangan mengganti file itu.

## Yang sudah ada

- Token visual dari situs web (`src/theme.ts`).
- Builder payload murni dan teruji (`src/qr.ts`, `__tests__/qr.test.ts`).
- Pemeriksaan keamanan link hasil pindai (`src/safety.ts`).
- Layar generator dengan pratinjau QR, simpan PNG, dan riwayat 20 item.
- Layar pemindai dengan izin kamera, anti-duplikat, salin, dan buka link.

## Yang belum ada

- Font Chakra Petch dan Atkinson Hyperlegible masih woff2. Sementara pakai font
  sistem; lihat `AGENTS.md` bagian 7.2.
- Tab "Gambar" dan logo kustom belum masuk scope.
- PNG diekspor lewat share sheet, belum tersimpan langsung ke galeri.
- Uji di HP belum dilakukan untuk versi React Native ini.
