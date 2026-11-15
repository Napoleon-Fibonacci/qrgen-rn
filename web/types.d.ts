/**
 * Deklarasi tipe untuk modul yang hanya dipakai pratinjau web.
 * Berkas ini tidak ikut ke bundel Android.
 */

declare module 'qrcode' {
  export interface QrCodeCreateOptions {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  }

  export interface QrCodeModules {
    data: ArrayLike<number>;
    size: number;
  }

  export interface QrCodeResult {
    modules: QrCodeModules;
  }

  export function create(value: string, options?: QrCodeCreateOptions): QrCodeResult;

  const QRCode: { create: typeof create };
  export default QRCode;
}

declare module 'react-native-web';

declare module '*.svg' {
  const source: string;
  export default source;
}
