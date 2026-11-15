/**
 * Builder payload QR. Semua fungsi di sini murni: tidak menyentuh React,
 * penyimpanan, atau kamera, sehingga bisa dites lewat Jest tanpa render.
 *
 * Perilaku mengikuti `../qrgen/assets/js/app.js`; lihat AGENTS.md bagian 8.
 */

export type QrType = 'url' | 'text' | 'wifi' | 'contact';

export type WifiEnc = 'WPA' | 'WEP' | 'nopass';

export interface WifiFields {
  ssid: string;
  password: string;
  enc: WifiEnc;
  hidden: boolean;
}

export interface ContactFields {
  name: string;
  tel: string;
  email: string;
  title: string;
}

export interface QrForm {
  url: string;
  text: string;
  wifi: WifiFields;
  contact: ContactFields;
}

/** Hasil builder: string yang masuk ke QR, plus label pendek untuk riwayat. */
export interface QrPayload {
  data: string;
  label: string;
}

/** Escape karakter khusus sesuai spec format WIFI. */
export function escWifi(value: string): string {
  return String(value).replace(/([\\;,:"])/g, '\\$1');
}

export function wifiString(fields: WifiFields): string {
  const parts = [
    'T:' + (fields.enc === 'nopass' ? 'nopass' : fields.enc),
    'S:' + escWifi(fields.ssid),
  ];
  if (fields.enc !== 'nopass' && fields.password) {
    parts.push('P:' + escWifi(fields.password));
  }
  if (fields.hidden) {
    parts.push('H:true');
  }
  return 'WIFI:' + parts.join(';') + ';;';
}

/** Escape sesuai spec vCard: backslash, koma, titik koma, newline. */
export function escVcf(value: string): string {
  return String(value)
    .replace(/([\\;,])/g, '\\$1')
    .replace(/\r?\n/g, '\\n');
}

export function vcardString(fields: ContactFields): string {
  const name = escVcf(fields.name);
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', 'N:' + name, 'FN:' + name];
  if (fields.tel) {
    lines.push('TEL;TYPE=CELL:' + fields.tel);
  }
  if (fields.email) {
    lines.push('EMAIL:' + escVcf(fields.email));
  }
  if (fields.title) {
    lines.push('TITLE:' + escVcf(fields.title));
  }
  lines.push('END:VCARD');
  return lines.join('\n');
}

/** Tambahkan `https://` kalau pengguna tidak menulis skema. */
export function normalizeUrl(value: string): string {
  const trimmed = String(value).trim();
  if (!trimmed) {
    return '';
  }
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return 'https://' + trimmed;
  }
  return trimmed;
}

export function slugify(value: string): string {
  const words = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .filter(Boolean)
    .slice(0, 3);
  return words.length ? words.join('-') : 'qr';
}

export interface FileNameInput {
  type: QrType;
  label: string;
  ext: 'png' | 'svg';
  /** Untuk tes. Kalau kosong, pakai waktu sekarang. */
  now?: Date | number;
}

export function fileName(info: FileNameInput): string {
  const date = info.now === undefined ? new Date() : new Date(info.now);
  const stamp = date.toISOString().slice(0, 10);
  return 'qr-' + info.type + '-' + slugify(info.label) + '-' + stamp + '.' + info.ext;
}

/** Rasio kontras warna QR terhadap latar putih (WCAG relative luminance). */
export function contrastAgainstWhite(hex: string): number {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!match) {
    return 21;
  }
  const value = parseInt(match[1], 16);
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  // Tanpa operator bitwise: baca tiga byte warna lewat pembagian.
  const red = Math.floor(value / 65536) % 256;
  const green = Math.floor(value / 256) % 256;
  const blue = value % 256;
  const luminance =
    0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
  return 1.05 / (luminance + 0.05);
}

/** Isi satu tipe. `null` berarti belum ada isi, jadi QR tidak ditampilkan. */
export function buildPayload(type: QrType, form: QrForm): QrPayload | null {
  switch (type) {
    case 'url': {
      const value = form.url.trim();
      if (!value) {
        return null;
      }
      const url = normalizeUrl(value);
      return { data: url, label: url.replace(/^https?:\/\//i, '') };
    }
    case 'text': {
      const value = form.text;
      if (!value.trim()) {
        return null;
      }
      return { data: value, label: value.trim().split(/\s+/).slice(0, 3).join(' ') };
    }
    case 'wifi': {
      const ssid = form.wifi.ssid.trim();
      if (!ssid) {
        return null;
      }
      return {
        data: wifiString({ ...form.wifi, ssid }),
        label: ssid,
      };
    }
    case 'contact': {
      const name = form.contact.name.trim();
      if (!name) {
        return null;
      }
      return {
        data: vcardString({ ...form.contact, name }),
        label: name,
      };
    }
    default:
      return null;
  }
}

/** Peringatan teks panjang, ambang sama dengan versi web. */
export const TEXT_WARN_LIMIT = 800;

/** Ambang kontras minimal supaya QR masih terbaca. */
export const CONTRAST_LIMIT = 3;
