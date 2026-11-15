/**
 * Konfigurasi pratinjau web. Bukan bagian aplikasi Android.
 *
 * `react-native` diarahkan ke `react-native-web`, dan tiga modul native yang
 * tidak punya versi browser diganti stub di `web/stubs`.
 *
 * Jalankan: npm run web
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const stub = (name: string) => fileURLToPath(new URL('./web/stubs/' + name, import.meta.url));

export default defineConfig({
  root: 'web',
  plugins: [react()],
  resolve: {
    // Urutan ini meniru platform resolution React Native, dengan `.web.*` didahulukan.
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.json',
    ],
    alias: [
      // Hanya `react-native` persis yang dialihkan. Subpath seperti
      // `react-native/Libraries/...` tetap dicari apa adanya.
      { find: /^react-native$/, replacement: fileURLToPath(new URL('./web/rn-web.ts', import.meta.url)) },
      { find: /^react-native-camera-kit$/, replacement: stub('camera-kit.tsx') },
      { find: /^react-native-safe-area-context$/, replacement: stub('safe-area.tsx') },
      { find: /^react-native-qrcode-svg$/, replacement: stub('qr-code.tsx') },
      { find: /^react-native-svg$/, replacement: stub('svg.tsx') },
      { find: /^react-native-share$/, replacement: stub('share.ts') },
      { find: /^@react-native-clipboard\/clipboard$/, replacement: stub('clipboard.ts') },
    ],
  },
  define: {
    __DEV__: 'true',
    global: 'globalThis',
  },
  server: {
    port: 5173,
    strictPort: true,
    fs: { allow: ['..'] },
  },
});
