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
  aman: { text: colors.blueDeep, background: 'rgba(26, 86, 176, 0.12)' },
  waspada: { text: '#7a5c00', background: 'rgba(255, 210, 63, 0.45)' },
  bahaya: { text: colors.danger, background: colors.dangerSoft },
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
 * Font web (Chakra Petch, Atkinson Hyperlegible) masih woff2 dan belum bisa
 * dibaca React Native. Sampai TTF terpasang, pakai font sistem dan jangan
 * mengaku memakai font COST. Lihat AGENTS.md bagian 7.2.
 */
export const fonts = {
  heading: 'sans-serif-medium',
  headingFamily: 'sans-serif',
  body: 'sans-serif',
} as const;

export const type = {
  appTitle: {
    fontFamily: fonts.headingFamily,
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  sectionTitle: {
    fontFamily: fonts.headingFamily,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.75,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '400',
    color: colors.inkSoft,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 25,
    color: colors.ink,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.ink,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: 15.5,
    fontWeight: '400',
    color: colors.ink,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '400',
    color: colors.inkSoft,
  },
  button: {
    fontFamily: fonts.headingFamily,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonMini: {
    fontFamily: fonts.headingFamily,
    fontSize: 12.5,
    fontWeight: '600',
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

/** Ukuran preview QR: minimal 220, maksimal 320. */
export const qrPreview = { min: 220, max: 320 } as const;

/** Resolusi PNG yang disimpan, minimal 1024 px. */
export const qrExportSize = 1024;
