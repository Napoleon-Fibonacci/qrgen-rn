/**
 * Pemeriksaan keamanan teks hasil pindai. Semua jalan lokal, tidak ada data
 * yang dikirim ke mana pun.
 *
 * Perilaku mengikuti `../qrgen/assets/js/scan.js` (`linkSafety`).
 */

export type SafetyLevel = 'ok' | 'warn' | 'bad';

export interface Safety {
  level: SafetyLevel;
  why: string[];
}

/** Label pendek untuk pilihan pindai. Teks ini yang tampil di pil status. */
export function safetyLabel(safety: Safety | null): string {
  if (!safety || safety.level === 'ok') {
    return 'Aman';
  }
  return safety.level === 'bad' ? 'Bahaya' : 'Waspada';
}

const SHORTENERS = [
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'is.gd',
  'ow.ly',
  'cutt.ly',
  'cutt.us',
  's.id',
  'v.gd',
  'rb.gy',
  'shorturl.at',
  'lnkd.in',
];

const SCHEME_WITH_SLASHES = /^[a-z][a-z0-9+.-]*:\/\//i;
const CONTACT_SCHEME = /^(javascript|data|vbscript|mailto|tel):/i;
const LOOKS_DOMAIN = /^(https?:\/\/|www\.)?[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)+([/:?#][^\s]*)?$/i;

/**
 * Pecah authority jadi host dan port tanpa `URL`, supaya perilaku sama di
 * Hermes dan di Jest.
 */
function splitAuthority(authority: string): { host: string; port: string } {
  const withoutUser = authority.includes('@') ? authority.slice(authority.lastIndexOf('@') + 1) : authority;
  if (withoutUser.startsWith('[')) {
    const close = withoutUser.indexOf(']');
    if (close === -1) {
      return { host: withoutUser.toLowerCase(), port: '' };
    }
    const rest = withoutUser.slice(close + 1);
    return {
      host: withoutUser.slice(0, close + 1).toLowerCase(),
      port: rest.startsWith(':') ? rest.slice(1) : '',
    };
  }
  const colon = withoutUser.lastIndexOf(':');
  if (colon === -1) {
    return { host: withoutUser.toLowerCase(), port: '' };
  }
  return { host: withoutUser.slice(0, colon).toLowerCase(), port: withoutUser.slice(colon + 1) };
}

function parseLink(text: string): { scheme: string; host: string; port: string } | null {
  const withScheme = SCHEME_WITH_SLASHES.test(text) || CONTACT_SCHEME.test(text);
  const raw = withScheme ? text : 'https://' + text;
  const match = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)/i.exec(raw);
  if (!match) {
    // mailto:/tel: tidak punya authority.
    const simple = /^([a-z][a-z0-9+.-]*):/i.exec(raw);
    if (!simple) {
      return null;
    }
    return { scheme: simple[1].toLowerCase(), host: '', port: '' };
  }
  const { host, port } = splitAuthority(match[2]);
  return { scheme: match[1].toLowerCase(), host, port };
}

export function linkSafety(value: string): Safety | null {
  const text = String(value).trim();
  if (!text) {
    return null;
  }
  const hasScheme = SCHEME_WITH_SLASHES.test(text) || CONTACT_SCHEME.test(text);
  const looksDomain = LOOKS_DOMAIN.test(text);
  if (!hasScheme && !looksDomain) {
    return null;
  }

  const parsed = parseLink(text);
  if (!parsed) {
    return { level: 'warn', why: ['URL tidak valid'] };
  }
  const { scheme, host, port } = parsed;

  if (scheme === 'javascript' || scheme === 'data' || scheme === 'vbscript') {
    return { level: 'bad', why: ['Skrip langsung (' + scheme + ':), jangan dibuka'] };
  }
  if (scheme === 'mailto' || scheme === 'tel') {
    return { level: 'ok', why: ['Link kontak (' + scheme + ':)'] };
  }
  if (scheme !== 'http' && scheme !== 'https') {
    return { level: 'warn', why: ['Skema tidak umum (' + scheme + ':)'] };
  }

  const why: string[] = [];
  if (scheme === 'http') {
    why.push('Tanpa enkripsi (HTTP)');
  }
  const isIpv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  const isIpv6 = host.startsWith('[');
  if (isIpv4 || isIpv6) {
    why.push('Pakai alamat IP, bukan nama domain');
  }
  if (host.includes('xn--')) {
    why.push('Domain punycode, mirip domain lain');
  }
  if (text.includes('@')) {
    why.push('Ada "@" di link, bisa menyembunyikan domain asli');
  }
  if (host.split('.').length > 4) {
    why.push('Subdomain bertumpuk');
  }
  if (port && port !== '80' && port !== '443') {
    why.push('Port tidak lazim (' + port + ')');
  }
  if (SHORTENERS.indexOf(host) > -1) {
    why.push('Pemendek link, tujuan asli disembunyikan');
  }
  if (!host.includes('.')) {
    why.push('Tanpa domain (.id dll)');
  }
  if (why.length) {
    return { level: 'warn', why };
  }
  return { level: 'ok', why: ['HTTPS, pola link wajar'] };
}

/** Tombol "Buka" hanya untuk link http/https. */
export function isOpenable(value: string): boolean {
  return /^https?:\/\//i.test(String(value).trim());
}
