/**
 * Stub kamera untuk pratinjau web. `react-native-camera-kit` tidak punya
 * implementasi browser, jadi komponen ini hanya menjelaskan keadaannya.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const CameraType = { Back: 'back', Front: 'front' } as const;

interface CameraProps {
  style?: unknown;
  onReadCode?: (event: unknown) => void;
  onError?: () => void;
}

export function Camera(_props: CameraProps) {
  return (
    <View style={styles.stub}>
      <Text style={styles.title}>Kamera tidak tersedia di pratinjau web</Text>
      <Text style={styles.text}>
        Jalankan aplikasi di HP atau emulator untuk mencoba pemindaian. Layar ini
        ditampilkan sebagai pengganti.
      </Text>
    </View>
  );
}

export default Camera;

const styles = StyleSheet.create({
  stub: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
    backgroundColor: '#0e1c2e',
  },
  title: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  text: {
    color: '#c9d3df',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
