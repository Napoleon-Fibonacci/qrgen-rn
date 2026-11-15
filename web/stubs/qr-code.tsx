/**
 * Pengganti `react-native-qrcode-svg` untuk pratinjau web.
 *
 * Paket aslinya mengirim JSX mentah dan bergantung pada `react-native-svg`
 * versi native, yang tidak bisa diproses bundler browser. Di sini matriks QR
 * diambil dari paket `qrcode` (sudah jadi dependency paket aslinya), lalu
 * digambar sebagai satu SVG data URI dan ditampilkan lewat `Image`.
 *
 * Tampilan sama-sama kotak hitam-putih. Bedanya hanya `toDataURL`: di web
 * hasilnya SVG, bukan PNG.
 */
import React, { useEffect, useMemo } from 'react';
import { Image } from 'react-native';
import QRCodeLib from 'qrcode';

export interface QRCodeProps {
  value?: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  ecl?: 'L' | 'M' | 'Q' | 'H';
  quietZone?: number;
  getRef?: (ref: unknown) => unknown;
}

interface Matrix {
  size: number;
  rows: number[][];
}

function buildMatrix(value: string, ecl: 'L' | 'M' | 'Q' | 'H'): Matrix | null {
  try {
    const created = QRCodeLib.create(value, { errorCorrectionLevel: ecl });
    const data = Array.prototype.slice.call(created.modules.data, 0) as number[];
    const size = Math.round(Math.sqrt(data.length));
    const rows: number[][] = [];
    for (let i = 0; i < size; i += 1) {
      rows.push(data.slice(i * size, (i + 1) * size));
    }
    return { size, rows };
  } catch {
    return null;
  }
}

function toSvgMarkup(
  matrix: Matrix,
  size: number,
  color: string,
  quietZone: number,
  background: string,
): string {
  const total = matrix.size + quietZone * 2;
  const cell = size / total;
  const rects: string[] = [];
  matrix.rows.forEach((row, y) => {
    row.forEach((isDark, x) => {
      if (!isDark) {
        return;
      }
      rects.push(
        '<rect x="' +
          ((x + quietZone) * cell).toFixed(2) +
          '" y="' +
          ((y + quietZone) * cell).toFixed(2) +
          '" width="' +
          cell.toFixed(2) +
          '" height="' +
          cell.toFixed(2) +
          '" fill="' +
          color +
          '"/>',
      );
    });
  });
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
    size +
    '" height="' +
    size +
    '" viewBox="0 0 ' +
    size +
    ' ' +
    size +
    '"><rect width="' +
    size +
    '" height="' +
    size +
    '" fill="' +
    background +
    '"/>' +
    rects.join('') +
    '</svg>'
  );
}

function toDataUri(markup: string): string {
  const encoded =
    typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(markup))) : '';
  return 'data:image/svg+xml;base64,' + encoded;
}

export default function QRCode({
  value = '',
  size = 200,
  color = '#000000',
  backgroundColor = '#ffffff',
  ecl = 'M',
  quietZone = 0,
  getRef,
}: QRCodeProps) {
  const matrix = useMemo(() => buildMatrix(value, ecl), [value, ecl]);

  useEffect(() => {
    if (!getRef) {
      return;
    }
    getRef({
      toDataURL: (callback: (data: string) => void) => {
        if (!matrix) {
          callback('');
          return;
        }
        callback(toDataUri(toSvgMarkup(matrix, size, color, quietZone, backgroundColor)));
      },
    });
  }, [backgroundColor, color, getRef, matrix, quietZone, size]);

  if (!matrix) {
    return null;
  }

  const uri = toDataUri(toSvgMarkup(matrix, size, color, quietZone, backgroundColor));
  return <Image source={{ uri }} style={{ width: size, height: size }} />;
}
