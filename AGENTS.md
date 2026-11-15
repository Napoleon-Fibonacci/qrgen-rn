# AGENTS.md — QrGenApp (React Native)

Dokumen ini adalah sumber kebenaran proyek. Agent dan manusia wajib membacanya sebelum
mengubah kode. Kalau ada keputusan baru, perbarui dokumen ini di commit yang sama.

Terakhir diperbarui: 15 November 2026.

---

## 1. Ringkasan

QrGenApp adalah percobaan membuat ulang COST QR Generator sebagai aplikasi Android
native memakai React Native. Tujuannya bukan menggantikan proyek web, tetapi
memahami cara kerja React Native dari dalam: komponen, state, Metro, Gradle, dan
build APK lewat GitHub Actions.

Proyek web lama ada di `../qrgen` dan **tidak boleh diubah dari sini**.

---

## 2. Latar belakang

Proyek `../qrgen` adalah situs statis (HTML, CSS, JS) dengan fitur:

- generator QR untuk URL, teks, WiFi, vCard, dan gambar;
- kustom warna dan logo;
- ekspor PNG/SVG;
- riwayat di `localStorage`;
- halaman pembaca QR/barcode;
- proxy upload gambar ke 8upload lewat `api/host.js` di Vercel.

Situs itu kemudian dibungkus jadi APK dengan Capacitor. Hasilnya jalan, tetapi
pemilik proyek ingin tahu bagaimana rasanya membangun aplikasi yang benar-benar
React Native. Karena itu dibuat proyek terpisah, bukan port langsung.

Pelajaran dari percobaan Capacitor yang relevan:

- `window.Capacitor.Plugins` kosong di halaman tanpa bundler; harus pakai
  `nativePromise()` dari native bridge.
- WebView tidak bisa mengunduh blob lewat `<a download>`.
- `fetch` dari WebView terkena CORS; butuh pengecualian origin di server.
- Debug keystore yang dibuat ulang tiap runner membuat APK tidak bisa menimpa
  versi sebelumnya. Perlu keystore stabil di repo.

Semua masalah itu tidak otomatis hilang di React Native, tetapi bentuknya berbeda.

---

## 3. Perbandingan pendekatan

| Aspek | Web + Capacitor (`../qrgen`) | React Native (proyek ini) |
|---|---|---|
| UI | HTML/CSS di WebView | Komponen native via `View`, `Text` |
| Render QR | canvas + `qr-code-styling` | `react-native-svg` + `react-native-qrcode-svg` |
| Download file | plugin Filesystem + Share | `react-native-share` (base64) |
| Penyimpanan | `localStorage` | AsyncStorage |
| Kamera | `getUserMedia` + html5-qrcode | library native kamera |
| CORS | ada, perlu diakali | tidak ada, `fetch` keluar dari WebView |
| Ukuran APK | ~4 MB | lebih besar, tapi tanpa WebView runtime |
| Waktu kerja | cepat, aset dipakai ulang | lambat, semua ditulis ulang |
| Cocok untuk | rilis cepat | belajar RN, kontrol native |

Keputusan sadar: proyek ini **tidak** mengejar paritas 100% dengan versi web.
Fitur yang terlalu mahal (logo kustom, SVG, kustom warna lanjutan) boleh ditunda
atau dilewati, selama alasan dicatat.

---

## 4. Keputusan yang sudah disepakati

| Topik | Keputusan | Alasan |
|---|---|---|
| Framework | Bare React Native CLI | Struktur Gradle terlihat, build APK tanpa akun EAS |
| Versi | RN 0.88.1, React 19.3.0 | Hasil scaffold, arsitektur baru default |
| Lokasi | `C:\My Project\qrgen-rn` | Repo web tetap bersih |
| Hubungan repo | Repo Git terpisah | Riwayat dan CI tidak bercampur |
| Package Android | `com.qrgenapp` | Beda dari `id.cost.qrgen`, dua APK bisa terpasang bareng |
| Scope awal | Generator + scanner | Fitur inti aplikasi asli |
| Navigasi | Tab sederhana dengan state | Dua layar belum butuh react-navigation |
| Bahasa UI | Indonesia, santai | Sama dengan proyek web |
| Build APK | GitHub Actions | Mesin lokal tidak punya JDK/SDK |
| Verifikasi | APK nyata di HP | Bukan hanya "kode terlihat benar" |

---

## 5. Cara kerja React Native (ringkas)

React Native bukan WebView. Tidak ada DOM, tidak ada HTML, tidak ada CSS.

- **Komponen**: `App.tsx` mengembalikan JSX. `<View>` seperti `div`, `<Text>` wajib
  membungkus semua teks. `<TextInput>`, `<Pressable>`, `<ScrollView>` punya perilaku
  native.
- **Style**: objek JavaScript lewat `StyleSheet.create`. Flexbox default
  `flexDirection: 'column'`, berbeda dari web. Tidak ada selector, cascade, atau `rem`.
- **Runtime**: JavaScript berjalan di Hermes. Jembatan ke native memakai JSI/Fabric
  (arsitektur baru). Tidak ada `window` atau `document`.
- **Metro**: bundler yang menyajikan JS saat development. APK debug biasanya butuh
  Metro; APK release membawa bundle sendiri.
- **Autolinking**: dependency native otomatis didaftarkan ke Gradle lewat
  `react-native.config.js` dan package masing-masing. Tidak ada `pubspec.yaml` atau
  `Podfile` manual untuk Android.
- **Gradle**: yang menghasilkan APK. `android/app/build.gradle` mengatur versi SDK,
  signing, dan dependency native.
- **State**: `useState`/`useReducer` cukup untuk dua layar. Tidak perlu Redux.

Konsekuensi praktis:

- Tidak bisa memakai `fetch` dengan `credentials`, `File`, `Blob`, `URL.createObjectURL`.
- Tidak ada `navigator.clipboard`; pakai library atau `Share`.
- Ukuran file, izin kamera, dan share sheet adalah urusan native, bukan browser.

---

## 6. Arsitektur target

```
index.js                 registrasi App
App.tsx                  tab "Buat" / "Pindai", state tab
src/theme.ts             token warna dan spasi
src/qr.ts                builder payload murni + tipe
src/screens/GenerateScreen.tsx
src/screens/ScanScreen.tsx
android/                 shell Gradle
```

Belum ada folder `components/`. Tambah kalau ada komponen yang dipakai dua layar.

### Alur generator

```
input -> builder di src/qr.ts -> string payload -> QRCode -> Share/base64
                            \-> riwayat AsyncStorage
```

Builder harus murni dan bisa dites tanpa render. Ini meniru `assets/js/app.js` di
proyek web supaya perilakunya sama.

### Alur scanner

```
kamera -> hasil barcode -> daftar hasil di memori -> aksi salin/buka
```

Hasil scan tidak disimpan permanen pada versi pertama. Alasannya data bisa berisi
WiFi atau kontak.

---

## 7. Sistem visual (diambil dari `../qrgen`)

Identitas visual mengikuti proyek web, bukan gaya default React Native. Sumber
kebenaran: `../qrgen/assets/css/style.css` dan `../qrgen/assets/css/scan.css`.
Jangan mengarang palet baru. Kalau butuh warna tambahan, turunkan dari token di bawah
dan catat di sini.

### 7.1 Token warna

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `paper` | `#f0f3f8` | latar layar |
| `band` | `#e1e9f3` | header, tab bar, kartu riwayat, footer |
| `card` | `#fbfdff` | kartu, input, tombol sekunder |
| `ink` | `#0e1c2e` | teks utama, toast |
| `inkSoft` | `#52647c` | hint, label sekunder, tanggal |
| `rule` | `rgba(14,28,46,0.22)` | border 1.5 |
| `ruleStrong` | `rgba(14,28,46,0.35)` | border input dan tombol |
| `gridLine` | `rgba(14,28,46,0.09)` | pola grid latar (opsional) |
| `blue` | `#1a56b0` | aksi utama, tab aktif |
| `blueDeep` | `#14478c` | pressed state biru |
| `cyan` | `#0e9cc0` | aksen sekunder |
| `signal` | `#ffd23f` | garis bawah judul, bingkai scan, warning |
| `danger` | `#b3261e` | hapus, error |
| `dangerSoft` | `#f9eceb` | latar tombol hapus |

Warna status scan (dari `scan.css`):

- aman: teks `blueDeep`, latar `rgba(26,86,176,0.12)`
- waspada: teks `#7a5c00`, latar `rgba(255,210,63,0.45)`
- bahaya: teks `danger`, latar `dangerSoft`

### 7.2 Tipografi

| Peran | Font | Ukuran | Berat |
|---|---|---|---|
| Judul aplikasi | Chakra Petch | 21 | 700, uppercase, letterSpacing 0.4 |
| Judul bagian | Chakra Petch | 15 | 700, uppercase, letterSpacing 0.75 |
| Tagline | Atkinson Hyperlegible | 14 | 400 |
| Body | Atkinson Hyperlegible | 16 | 400, lineHeight 25 |
| Label field | Atkinson Hyperlegible | 14.5 | 700 |
| Isi input | Atkinson Hyperlegible | 15.5 | 400 |
| Hint | Atkinson Hyperlegible | 13 | 400 |
| Tombol | Chakra Petch | 14 | 600 |
| Tombol mini | Chakra Petch | 12.5 | 600 |

Catatan font: berkas asli di `../qrgen/assets/fonts/` berformat **woff2**, dan React
Native tidak membacanya. Font sudah dikonversi ke TTF memakai fontTools lokal:

| Berkas TTF | Sumber woff2 | family RN |
|---|---|---|
| `ChakraPetch-Bold.ttf` | `chakra-petch-700.woff2` | `ChakraPetch-Bold` |
| `ChakraPetch-SemiBold.ttf` | `chakra-petch-600.woff2` | `ChakraPetch-SemiBold` |
| `AtkinsonHyperlegible-Regular.ttf` | `atkinson-hyperlegible-400.woff2` | `AtkinsonHyperlegible-Regular` |
| `AtkinsonHyperlegible-Bold.ttf` | `atkinson-hyperlegible-700.woff2` | `AtkinsonHyperlegible-Bold` |

Salinan ada di `assets/fonts/` (sumber), `android/app/src/main/assets/fonts/` (dipakai
APK), dan `web/public/fonts/` (pratinjau web). `react-native.config.js` berisi
`assets: ['./assets/fonts']`; kalau isi `assets/fonts` berubah, jalankan
`npx react-native-asset` lalu salin ulang ke folder web.

Bobot sudah menempel di masing-masing berkas, jadi gaya di `src/theme.ts` tidak
memakai `fontWeight`. Menambahkan `fontWeight` akan memaksa Android memalsukan
tebal huruf dan hasilnya tidak sama dengan desain.

Jangan memakai font lain sebagai pengganti diam-diam.

### 7.3 Spasi, radius, bayangan

- Skala spasi: 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 40.
- Padding layar: 16 di HP, 24 di layar lebar.
- Radius: input 6, tombol 8, kartu 10, chip 6, pil status 999.
- Border: 1.5 untuk kartu dan input, 4 untuk garis bawah judul, 6 untuk strip biru header.
- Bayangan kartu: `0 10px 28px rgba(14,28,46,0.10)`. Di HP boleh lebih tipis:
  `0 6px 16px rgba(14,28,46,0.08)`.
- React Native 0.88 mendukung `boxShadow` di arsitektur baru. Kalau tidak konsisten,
  pakai `elevation` (Android) + `shadowColor/shadowOpacity/shadowRadius/shadowOffset`
  (iOS).

### 7.4 Pemetaan komponen web ke React Native

| Web | RN | Catatan |
|---|---|---|
| `.topbar` + `.brand` | `View` header | kartu `card`, border 1.5, radius 10, strip biru 6 di atas |
| `.brand h1` | `Text` | Chakra Petch 21 uppercase |
| `.tagline` | `Text` | 14, `inkSoft` |
| `.topnav` / `.navbtn` | `Pressable` | segmented, aktif `blue` + teks putih |
| `.tabs` / `.tab` | `View` + `Pressable` | `band`, radius 9, padding 4, aktif `blue` |
| `.field label` | `Text` | 14.5 bold, margin bawah 6 |
| `.field input` | `TextInput` | `card`, border 1.5 `ruleStrong`, radius 6, padding 10/12 |
| fokus input | state `focused` | border `blue`, tebal tetap 1.5 |
| `.hint` | `Text` | 13 `inkSoft`, margin atas 6 |
| `.warn` | `Text` | latar `rgba(255,210,63,0.35)`, border 1, radius 7, padding 8/10 |
| `.btn` | `Pressable` | radius 8, padding 11/12, min height 44 |
| `.btn-primary` | `Pressable` | `blue`, teks putih, selebar kartu |
| `.btn-danger` | `Pressable` | `dangerSoft`, teks `danger`, border transparan |
| `.preview-card` | `View` | `card`, border 1.5, radius 10, padding 20 |
| `.qr-stage` | `View` | kotak maksimal 320, rasio 1:1, latar putih |
| `.scan-hint` | `Text` | 13, rata tengah |
| `.history` + `.hist-item` | `View` + `FlatList` | `band`, border 1.5, radius 10, padding 10 |
| thumbnail 96 | `Image` | 96x96, radius 6, latar `card` |
| `.toast` | `Animated.View` | `ink`, teks putih, radius 8, bawah 24, maksimal 90% lebar |
| `.result-hero` | `View` | `card`, border atas 4 `blue`, radius 10, padding 16/18 |
| `.result-row` | `Pressable` | border bawah 1 `rule`, padding 10/4 |
| `.scan-frame` | 4 `View` sudut | border 3 `signal`, 28x28 |

### 7.5 Gerak

- Masuk layar: opacity 0→1 + translateY 14→0, 0.55s,
  `Easing.bezier(0.16, 1, 0.3, 1)`. Sekali saat mount.
- QR muncul: scale 0.96→1 + opacity, 0.25s.
- Tidak ada animasi saat mengetik, kecuali debounce 180ms sebelum render QR.
- Scanline preview boleh dilewati di versi RN.
- Hormati reduced motion: `AccessibilityInfo.isReduceMotionEnabled()`; kalau aktif,
  lewati semua animasi.

### 7.6 Layout responsif

- Mobile-first, satu kolom. Form di atas, preview QR di bawahnya.
- Lebar layar >= 900: dua kolom, form kiri dan preview kanan. Preview tidak perlu
  sticky; React Native tidak punya `position: sticky` yang sama.
- `useWindowDimensions()` untuk breakpoint, bukan media query.
- Target sentuh minimal 44x44.
- Layar sempit: judul 16 agar tetap satu baris.

### 7.7 Perbedaan per platform

- **Android**: `android_ripple={{ color: 'rgba(26,86,176,0.12)' }}` pada `Pressable`;
  bayangan pakai `elevation`; tombol back ditangani `BackHandler`; status bar
  `backgroundColor: paper`, `barStyle: 'dark-content'`.
- **iOS**: bayangan pakai `shadow*`; `KeyboardAvoidingView` wajib untuk form;
  safe area atas/bawah dari `react-native-safe-area-context`.
- **Font**: TTF sudah ada di `android/app/src/main/assets/fonts`; iOS belum punya
  proyek, jadi entri `UIAppFonts` di `Info.plist` belum dibuat. Font web ada di
  `web/public/fonts` dengan `@font-face` di `web/index.html`.
- **Input**: `keyboardType` disesuaikan (`url`, `phone-pad`, `email-address`),
  `autoCapitalize="none"` untuk URL dan email.

### 7.8 Aksesibilitas

- `accessibilityRole="button"` untuk `Pressable`, `accessibilityLabel` untuk tombol
  ikon.
- `TextInput` selalu punya label visual; `accessibilityLabel` bila label terpisah.
- Jangan mengandalkan warna saja: status scan juga pakai teks.
- Kontras teks minimal 4.5:1. `ink` di `paper` dan putih di `blue` lolos.
- `allowFontScaling` jangan dimatikan.
- `signal` hanya untuk latar/garis, jangan teks kecil di atasnya.

### 7.9 Yang tidak dibawa

- Pola grid latar penuh. Bisa diganti gambar tile statis kalau perlu; versi pertama
  cukup `paper` solid.
- Animasi entrance bertingkat tiap elemen. Cukup satu animasi per layar.
- Scanline berulang dan loader grid 25 kotak.
- `:hover`. Di sentuh tidak ada hover; pakai `pressed` state.

---

## 8. Spesifikasi perilaku (paritas dengan web)

Ambil dari `../qrgen/assets/js/app.js` sebagai referensi, jangan menyalin kode
apa adanya.

### URL

- Trim spasi.
- Kalau tidak ada skema (`^[a-zA-Z][a-zA-Z0-9+.\-]*:`), tambahkan `https://`.
- Kosong berarti tidak ada QR.

### WiFi

Format string:

```
WIFI:T:<WPA|WEP|nopass>;S:<ssid>;P:<password>;H:true;;
```

- `P` hanya kalau bukan `nopass` dan password tidak kosong.
- `H` hanya kalau jaringan tersembunyi.
- Karakter `\ ; , : "` di-escape dengan backslash.

### vCard

```
BEGIN:VCARD
VERSION:3.0
N:<nama>
FN:<nama>
TEL;TYPE=CELL:<telepon>      (opsional)
EMAIL:<email>                (opsional)
TITLE:<jabatan>              (opsional)
END:VCARD
```

- Escape `\`, `;`, `,` dengan backslash; newline jadi `\n`.
- Nama kosong berarti tidak ada QR.

### Teks

- Trim untuk cek kosong, payload memakai teks asli.
- Peringatan kalau lebih dari 800 karakter.

### QR

- Ukuran preview mengikuti lebar layar, minimal 220, maksimal 320.
- Warna default `#111111`, latar putih.
- Simpan PNG resolusi tinggi (minimal 1024 px) lewat `toDataURL()`.
- Nama file: `qr-<tipe>-<slug>-<YYYY-MM-DD>.png`.

### Error correction

- Tanpa logo: level M.
- Dengan logo: level H. Logo belum masuk scope awal.

---

## 9. Rencana kerja bertahap

Setiap tahap harus bisa dijalankan atau diuji sebelum lanjut. Jangan menumpuk
beberapa tahap dalam satu commit besar.

### Tahap 0 — Fondasi

- `npm install` bersih.
- `npm test` dan `npm run lint` lulus.
- `src/theme.ts` berisi token warna, spasi, radius, dan tipografi sesuai bagian 7.
- APK debug dari CI bisa dipasang dan menampilkan layar awal.

### Tahap 1 — Generator teks dan URL

- Dua input, satu tombol, QR muncul.
- Ganti input memperbarui QR dengan debounce.
- Tidak ada crash saat input kosong.

### Tahap 2 — WiFi dan Kontak

- Builder murni + unit test.
- Escape karakter benar.
- QR bisa dipindai aplikasi lain dan menghasilkan data yang sama.

### Tahap 3 — Simpan dan bagikan

- `toDataURL()` menghasilkan PNG.
- Share sheet Android muncul.
- File bisa disimpan ke galeri/Drive dari share sheet.

### Tahap 4 — Riwayat

- Maksimal 20 item.
- Hapus satu dan hapus semua.
- Tidak menyimpan data kalau AsyncStorage gagal.

### Tahap 5 — Scanner

- Izin kamera ditangani (diberikan dan ditolak).
- Kamera berhenti saat tab tidak aktif.
- Hasil duplikat tidak ditambahkan dua kali.
- Tombol salin dan buka link berfungsi.

### Tahap 6 — CI dan distribusi

- Workflow APK debug.
- Debug keystore stabil di repo.
- Artifact bisa diunduh.
- Catatan cara pasang di README.

---

## 10. Cara kerja kita

### Peran

- Pemilik proyek menentukan arah, mencoba di HP, dan memberi umpan balik.
- Agent menulis kode, menjelaskan perubahan, dan memverifikasi sebisanya.

### Aturan komunikasi

- Bahasa percakapan: Indonesia, ringkas.
- Dokumen, komentar kode, nama commit: kalimat lengkap, bukan singkatan pribadi.
- Sebut path file saat menjelaskan perubahan.
- Jangan mengklaim "sudah jalan" tanpa bukti build atau uji perangkat.
- Kalau ada dua pilihan yang sama kuat, tanya dulu, jangan diam-diam memilih.

### Aturan perubahan

- Satu commit = satu tujuan yang bisa dijelaskan dalam satu kalimat.
- Jangan menyentuh `../qrgen` kecuali diminta eksplisit.
- Jangan menghapus atau menulis ulang file yang tidak terkait.
- Jangan commit `node_modules`, build output, keystore rilis, atau `.env`.
- Jalankan `npm run lint` dan `npm test` sebelum commit kalau tersedia.
- Perbarui AGENTS.md kalau keputusan berubah.

### Verifikasi

- Mesin ini tidak punya JDK/Android SDK. Build diverifikasi di GitHub Actions.
- Untuk perubahan UI, minta pemilik proyek menguji di HP dan laporkan teks error persis.
- Untuk logika murni (`src/qr.ts`), tulis unit test Jest; itu bisa dijalankan lokal.

---

## 11. Lingkungan

- Windows, shell bash (Git Bash).
- Node 24, npm 11.
- Tidak ada JDK, Android SDK, emulator, atau perangkat tersambung di mesin agent.
- File teks LF. Peringatan CRLF dari Git normal.
- Jangan pakai `sudo`, `apt`, atau tool Linux lain.
- Path dengan spasi harus dikutip.

---

## 12. Perintah

```
npm install
npx react-native start
npx react-native run-android
npm test
npm run lint

cd android && gradlew assembleDebug
```

Build CI:

```
checkout -> setup-node 22 -> setup-java 21 -> npm ci
         -> lint -> test -> gradlew assembleRelease
         -> catat ukuran APK -> upload dua artifact (arm64-v8a, armeabi-v7a)
```

Catatan penting:

- Jangan pakai `android-actions/setup-android`; di proyek web langkah itu gagal.
- Commit `android/app/debug.keystore` dan daftarkan di `signingConfigs.debug`
  supaya signature stabil antar-build.
- `assembleDebug` menghasilkan APK yang biasanya masih butuh Metro. Untuk APK
  yang bisa dibagikan tanpa Metro, build `assembleRelease` dengan signing debug,
  atau tambahkan langkah bundling JS eksplisit ke Gradle.
- Ukuran terukur: `arm64-v8a` 25 MB, `armeabi-v7a` 19 MB. Jangan menulis
  perkiraan yang lebih kecil dari itu. Rincian isi APK dicetak di log CI.

---

## 13. Risiko dan mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Library tidak support arsitektur baru | build gagal | pasang satu per satu, cek rilis terbaru |
| `react-native-camera-kit` rewel | scanner tertunda | fallback `react-native-vision-camera` |
| Share base64 terlalu besar | share gagal | turunkan resolusi atau tulis file dulu |
| APK debug butuh Metro | APK tidak bisa dibagi | build release dengan debug key |
| AsyncStorage penuh | riwayat hilang | batasi jumlah item, tangani error |
| Data sensitif di riwayat | kebocoran | batasi item, sediakan hapus semua |
| Signature berubah antar-CI | harus uninstall | debug keystore stabil |
| Scope melebar | tidak selesai | ikuti tahap 0–6, catat ide di backlog |

---

## 14. Glosarium

- **Metro**: bundler JavaScript React Native.
- **Hermes**: mesin JavaScript bawaan RN.
- **JSI / Fabric**: lapisan komunikasi JS ke native pada arsitektur baru.
- **Autolinking**: pendaftaran otomatis library native ke Gradle.
- **Debug keystore**: kunci tanda tangan untuk build debug, bukan untuk rilis.
- **Payload**: string yang masuk ke QR (URL, `WIFI:...`, vCard).
- **vCard**: format kontak, di sini versi 3.0.

---

## 15. Log keputusan

| Tanggal | Keputusan | Catatan |
|---|---|---|
| 14 Nov 2026 | Proyek web dibungkus Capacitor, APK debug sukses di CI | Lihat `../qrgen` |
| 15 Nov 2026 | Proyek RN terpisah dibuat di `qrgen-rn` | Percobaan belajar RN |
| 15 Nov 2026 | Bare RN CLI 0.88.1, bukan Expo | Transparansi Gradle |
| 15 Nov 2026 | Scope generator + scanner | Fitur inti |
| 15 Nov 2026 | Package `com.qrgenapp` | Bisa dipasang berdampingan dengan APK Capacitor |
| 15 Nov 2026 | Tambah `@react-native-clipboard/clipboard` | `Clipboard` bukan lagi bagian inti React Native |
| 15 Nov 2026 | APK CI memakai `assembleRelease` dengan debug key | APK bisa dibagikan tanpa Metro |
| 15 Nov 2026 | Pratinjau web lewat `react-native-web` + Vite di folder `web/` | Live preview tanpa emulator; kamera di-stub, bukan bukti APK |
| 15 Nov 2026 | Font COST dikonversi woff2 → TTF dengan fontTools lokal | RN tidak membaca woff2; tanpa unduhan baru |
| 15 Nov 2026 | APK hanya 2 ABI, R8 + resource shrinking + ABI split | Buang x86/x86_64 yang hanya untuk emulator |

---

## 16. Status

Kode versi pertama sudah ditulis dan lolos `npm test` (30 tes), `npm run lint`,
dan `npx tsc --noEmit` di mesin lokal. Belum satu pun diuji di APK.

- [x] Scaffold React Native 0.88.1
- [x] `npm install`
- [x] Token visual di `src/theme.ts`
- [x] Font COST dalam bentuk TTF, terpasang di Android dan pratinjau web
- [x] Dependency QR, share, storage, clipboard, kamera
- [x] Builder payload murni + unit test (`src/qr.ts`)
- [x] Layar generator (kode selesai, belum diuji di HP)
- [x] Simpan/bagikan PNG (kode selesai, belum diuji di HP)
- [x] Riwayat lokal (kode selesai, belum diuji di HP)
- [x] Layar scanner (kode selesai, belum diuji di HP)
- [x] Workflow GitHub Actions (sudah jalan; build release sukses)
- [x] Setelan ukuran APK: 2 ABI, R8, resource shrinking, ABI split (arm64 25 MB, v7a 19 MB, terukur di CI)
- [ ] Uji di HP

Jangan centang item yang belum diuji di APK.
