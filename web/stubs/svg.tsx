/**
 * Stub `react-native-svg` untuk pratinjau web.
 *
 * Aplikasi hanya memakai `SvgXml` untuk ikon Phosphor. Di browser ikon bisa
 * langsung ditanam sebagai HTML, sehingga Vite tidak perlu membaca berkas
 * native react-native-svg.
 */
import React from 'react';

/** Gaya DOM, bukan StyleSheet React Native: stub ini hanya jalan di browser. */
const boxStyle = { display: 'inline-flex' } as const;

interface SvgXmlProps {
  xml: string;
  width?: number | string;
  height?: number | string;
}

export function SvgXml({ xml, width = 20, height = 20 }: SvgXmlProps) {
  return (
    <span
      style={{ ...boxStyle, width, height }}
      dangerouslySetInnerHTML={{ __html: xml }}
    />
  );
}

export default { SvgXml };
