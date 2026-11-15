/**
 * Token visual QrGenApp.
 *
 * Sumber kebenaran ada di `../qrgen/assets/css/style.css` dan `style.css` bagian
 * scan. Jangan menambah warna baru di layar; turunkan dari token di sini dan
 * catat di AGENTS.md bagian 7.1.
 */

export const colors = {
  paper: '#f0f3f8',
  band: '#e1e9f3',
  card: '#fbfdff',
  ink: '#0e1c2e',
  inkSoft: '#52647c',
  rule: 'rgba(14, 28, 46, 0.22)',
  ruleStrong: 'rgba(14, 28, 46, 0.35)',
  gridLine: 'rgba(14, 28, 46, 0.09)',
  blue: '#1a56b0',
  blueDeep: '#14478c',
  cyan: '#0e9cc0',
  signal: '#ffd23f',
  danger: '#b3261e',
  dangerSoft: '#f9eceb',
} as const;

/** Warna status hasil scan. Teks warna ini selalu didampingi label teks. */
export const scanStatus = {
  aman: { text: colors.ink, background: colors.card, border: colors.rule },
  waspada: { text: colors.ink, background: colors.signal, border: colors.signal },
  bahaya: { text: '#ffffff', background: colors.danger, border: colors.danger },
} as const;

/** Skala spasi: 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 40. */
export const space = {
  xs: 4,
  s: 6,
  sm: 8,
  m: 10,
  md: 12,
  ml: 14,
  l: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  huge: 40,
} as const;

export const radius = {
  chip: 6,
  input: 6,
  button: 8,
  card: 10,
  tabBar: 9,
  pill: 999,
} as const;

export const border = {
  /** Kartu dan input. */
  line: 1.5,
  /** Garis bawah judul. */
  titleUnderline: 4,
  /** Strip biru di atas header. */
  headerStrip: 6,
} as const;

/**
 * Font COST. Berkas aslinya woff2 di `../qrgen/assets/fonts`, dikonversi ke TTF
 * karena React Native tidak membaca woff2.
 *
 * Nama family harus sama persis dengan nama berkas di
 * `android/app/src/main/assets/fonts` dan dengan `@font-face` di
 * `web/index.html`. Bobot sudah menempel di berkasnya, jadi jangan tambah
 * `fontWeight` pada gaya yang memakai family ini.
 */
export const fonts = {
  heading: 'ChakraPetch-Bold',
  headingMedium: 'ChakraPetch-SemiBold',
  body: 'AtkinsonHyperlegible-Regular',
  bodyBold: 'AtkinsonHyperlegible-Bold',
} as const;

export const type = {
  appTitle: {
    fontFamily: fonts.heading,
    fontSize: 21,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkSoft,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 25,
    color: colors.ink,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: 15.5,
    color: colors.ink,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
  },
  button: {
    fontFamily: fonts.heading,
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#ffffff',
  },
  buttonMini: {
    fontFamily: fonts.heading,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  pill: {
    fontFamily: fonts.heading,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  /** Pil kecil di kartu riwayat, 11 px seperti desain. */
  pillSmall: {
    fontFamily: fonts.heading,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.ink,
  },
} as const;

/**
 * Bayangan kartu. Android memakai `elevation`, iOS memakai `shadow*`.
 * Nilai diambil dari `0 6px 16px rgba(14,28,46,0.08)`.
 */
export const shadow = {
  card: {
    elevation: 3,
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
} as const;

/** Target sentuh minimal Android/iOS. */
export const minTouch = 44;

/** Lebar layar >= 900 memakai dua kolom. */
export const wideBreakpoint = 900;

/** Ukuran preview QR: mengikuti desain, maksimal 240. */
export const qrPreview = { min: 200, max: 240 } as const;

/** Resolusi PNG yang disimpan, minimal 1024 px. */
export const qrExportSize = 1024;
